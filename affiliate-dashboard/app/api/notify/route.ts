import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/config";
import { emailConfigured, sendEmail } from "@/lib/email";
import { adminDigestEmail, reconnectEmail } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProblem, type SyncRun } from "@/lib/sync-log";

const STALE_AFTER_MS = 3 * 86_400_000; // alerts older than this are dropped instead of sent late

/**
 * Daily job (pg_cron -> pg_net, 30 minutes after the sync). Authenticated with the same shared secret as the sync
 * function. Sends (1) "please reconnect" emails queued by the database and (2) one summary to the admins.
 */
export async function POST(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: "disabled in demo mode" }, { status: 503 });

  const admin = createAdminClient();
  const given = request.headers.get("x-sync-secret") ?? "";
  const { data: ok } = given ? await admin.rpc("check_sync_secret", { p_given: given }) : { data: false };
  if (ok !== true) return new Response("Unauthorized", { status: 401 });

  // Without an email provider nothing is sent; queued alerts wait (and expire after 3 days).
  if (!emailConfigured()) return NextResponse.json({ skipped: "email_not_configured" });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const result = { owners: 0, failed: 0, stale: 0, digest: false };

  // 1) Owners whose connection needs reconnecting.
  const { data: queued } = await admin
    .from("notifications")
    .select("id, profile_id, payload, created_at")
    .eq("kind", "connection_needs_reconnect").is("sent_at", null).order("created_at").limit(500);

  const byProfile = new Map<string, NonNullable<typeof queued>>();
  for (const n of queued ?? []) {
    if (Date.now() - new Date(n.created_at).getTime() > STALE_AFTER_MS) {
      await admin.from("notifications").update({ sent_at: new Date().toISOString(), error: "stale" }).eq("id", n.id);
      result.stale++;
      continue;
    }
    if (n.profile_id) byProfile.set(n.profile_id, [...(byProfile.get(n.profile_id) ?? []), n]);
  }
  for (const [profileId, items] of byProfile) {
    const { data: profile } = await admin.from("profiles").select("email, status").eq("id", profileId).maybeSingle();
    const ids = items.map((i) => i.id);
    if (!profile?.email || profile.status !== "active") {
      await admin.from("notifications").update({ sent_at: new Date().toISOString(), error: "no active recipient" }).in("id", ids);
      continue;
    }
    const mail = reconnectEmail(items.map((i) => i.payload as { platform: string; account_name: string }), site);
    const sent = await sendEmail(profile.email, mail);
    if (sent.ok) { await admin.from("notifications").update({ sent_at: new Date().toISOString() }).in("id", ids); result.owners++; }
    else { await admin.from("notifications").update({ error: sent.reason ?? "send failed" }).in("id", ids); result.failed++; }
  }

  // 2) Daily summary for admins: sync problems of the last 24 hours and accounts waiting for approval.
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [{ data: runs }, { count: pendingCount }, { data: admins }] = await Promise.all([
    admin.from("sync_runs")
      .select("id, started_at, source, connection_id, profile_id, platform, status, videos, warnings, duration_ms, profiles(name, email), connections(account_name)")
      .gte("started_at", since).order("started_at", { ascending: false }).limit(200),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("email").eq("role", "admin").eq("status", "active").not("email", "is", null),
  ]);
  type Row = Omit<SyncRun, "profile_name" | "account_name"> & { profiles: { name: string; email: string | null } | null; connections: { account_name: string } | null };
  const problemRuns = ((runs ?? []) as unknown as Row[])
    .map(({ profiles, connections, ...r }): SyncRun => ({
      ...r, warnings: Array.isArray(r.warnings) ? r.warnings.map(String) : [],
      profile_name: profiles?.name || profiles?.email || undefined, account_name: connections?.account_name,
    }))
    .filter((r) => isProblem(r.status));
  const digest = adminDigestEmail({ runs: problemRuns, pendingCount: pendingCount ?? 0 }, site);
  if (digest) {
    for (const a of admins ?? []) if (a.email) await sendEmail(a.email, digest);
    result.digest = true;
  }
  return NextResponse.json(result);
}
