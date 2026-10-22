import "server-only";
import type { ConnectionRow } from "@/components/connections-card";
import { DEMO_MODE } from "./config";
import { demoData } from "./demo/data";
import { connection } from "next/server";
import { cache } from "react";
import type { ConnectionSummaryRow, ProfileRow } from "./admin";
import type { UserRow } from "./admin-users";
import type { SyncRun } from "./sync-log";
import { createAdminClient } from "./supabase/admin";
import type { Range } from "./dates";
import type { VideoStat } from "./stats";
import { fetchAll } from "./supabase/fetch-all";
import { createClient } from "./supabase/server";

/** Everything the affiliate dashboard shows for one user. Serves seeded data in DEMO_MODE. */
export async function loadMyData(userId: string, range: Range) {
  if (DEMO_MODE) {
    const d = demoData();
    // Demo only: DEMO_EMPTY=true previews a brand-new user; DEMO_EMPTY=connected previews "connected, not synced yet".
    const empty = process.env.DEMO_EMPTY;
    if (empty === "true") return { connections: [] as ConnectionRow[], videos: [], igProfileTaps: null };
    const connections: ConnectionRow[] = d.connections
      .filter((c) => c.profile_id === userId)
      .map(({ id, platform, account_name, status, last_synced_at }) => ({ id, platform, account_name, status, last_synced_at }));
    const hasIg = connections.some((c) => c.platform === "instagram");
    const igProfileTaps = hasIg
      ? d.taps.filter((t) => t.profile_id === userId && t.date >= range.from && t.date <= range.to).reduce((n, t) => n + t.taps, 0)
      : null;
    if (empty === "connected") return { connections: connections.map((c) => ({ ...c, last_synced_at: null })), videos: [], igProfileTaps: null };
    return { connections, videos: d.videos.filter((v) => v.profile_id === userId), igProfileTaps };
  }

  const supabase = await createClient();
  // Always filter by owner: admins can read every row via RLS, but this is the personal view.
  const [connRes, videos] = await Promise.all([
    supabase.from("connections").select("id, platform, account_name, status, last_synced_at").eq("profile_id", userId).order("created_at"),
    fetchAll<VideoStat>((a, b) =>
      supabase.from("videos_with_latest_metrics").select("*").eq("profile_id", userId)
        .order("published_at", { ascending: false }).order("id").range(a, b)),
  ]);
  const connections = (connRes.data ?? []) as ConnectionRow[];

  let igProfileTaps: number | null = null;
  if (connections.some((c) => c.platform === "instagram")) {
    const { data: taps } = await supabase
      .from("account_metrics_daily").select("profile_link_taps, connections!inner(profile_id)")
      .eq("connections.profile_id", userId).gte("date", range.from).lte("date", range.to);
    igProfileTaps = (taps ?? []).reduce((n, r) => n + Number(r.profile_link_taps), 0);
  }
  return { connections, videos, igProfileTaps };
}

/** Everything the admin view shows. Caller must have verified the admin role. */
export async function loadAdminData() {
  if (DEMO_MODE) {
    const d = demoData();
    return { profiles: d.profiles, connections: d.connections as ConnectionSummaryRow[], videos: d.videos };
  }
  const supabase = await createClient();
  const [profiles, connections, videos] = await Promise.all([
    fetchAll<ProfileRow>((a, b) =>
      supabase.from("profiles").select("id, name, email").eq("role", "affiliate").eq("status", "active").order("created_at").range(a, b)),
    fetchAll<ConnectionSummaryRow>((a, b) =>
      supabase.from("connections").select("profile_id, platform, account_name, status, last_synced_at").order("created_at").range(a, b)),
    fetchAll<VideoStat>((a, b) =>
      supabase.from("videos_with_latest_metrics").select("*").order("published_at", { ascending: false }).order("id").range(a, b)),
  ]);
  return { profiles, connections, videos };
}

/** Accounts waiting for approval (admins only; RLS returns 0 rows to anyone else). Cached per request. */
export const loadPendingCount = cache(async (): Promise<number> => {
  if (DEMO_MODE) {
    await connection();
    return demoData().users.filter((u) => u.status === "pending").length;
  }
  const { count } = await (await createClient()).from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
});

export type SignupMode = "open" | "approval";

/** Everything the admin Users page shows. Caller must have verified the admin role. */
export async function loadUsersData(): Promise<{
  users: UserRow[]; signupMode: SignupMode; invites: { email: string; created_at: string }[];
}> {
  if (DEMO_MODE) {
    await connection(); // demo data is relative to the current time: render per request
    const d = demoData();
    return { users: d.users, signupMode: "approval", invites: d.invites };
  }
  const supabase = await createClient();
  const admin = createAdminClient(); // app_settings and invites are service-role only
  const [profiles, conns, settings, invites] = await Promise.all([
    fetchAll<{ id: string; name: string; email: string | null; role: UserRow["role"]; status: UserRow["status"]; created_at: string }>((a, b) =>
      supabase.from("profiles").select("id, name, email, role, status, created_at").order("created_at", { ascending: false }).range(a, b)),
    fetchAll<{ profile_id: string }>((a, b) => supabase.from("connections").select("profile_id").order("created_at").range(a, b)),
    admin.from("app_settings").select("signup_mode").eq("id", true).maybeSingle(),
    admin.from("invites").select("email, created_at").is("accepted_at", null).order("created_at", { ascending: false }).limit(50),
  ]);
  const counts = new Map<string, number>();
  for (const c of conns) counts.set(c.profile_id, (counts.get(c.profile_id) ?? 0) + 1);
  return {
    users: profiles.map((p) => ({ ...p, accounts: counts.get(p.id) ?? 0 })),
    signupMode: settings.data?.signup_mode === "open" ? "open" : "approval",
    invites: invites.data ?? [],
  };
}

/** Sync runs of the last 7 days, newest first (admins only; RLS enforces it). */
export async function loadSyncLog(): Promise<SyncRun[]> {
  if (DEMO_MODE) {
    await connection();
    return demoData().syncRuns;
  }
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await (await createClient())
    .from("sync_runs")
    .select("id, started_at, source, connection_id, profile_id, platform, status, videos, warnings, duration_ms, profiles(name, email), connections(account_name)")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(300);
  type Row = Omit<SyncRun, "profile_name" | "account_name"> & {
    profiles: { name: string; email: string | null } | null; connections: { account_name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map(({ profiles, connections, ...r }) => ({
    ...r,
    warnings: Array.isArray(r.warnings) ? r.warnings.map(String) : [],
    profile_name: profiles?.name || profiles?.email || undefined,
    account_name: connections?.account_name,
  }));
}
