import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TopVideos } from "@/components/dashboard/top-videos";
import { affiliateSummaries, type ConnectionSummaryRow, type ProfileRow, type SyncStatus } from "@/lib/admin";
import { addDays, manilaDate } from "@/lib/dates";
import { formatDate, formatNumber } from "@/lib/format";
import { topVideos, type SortKey, type TopWindow, type VideoStat } from "@/lib/stats";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { resyncAffiliate } from "./actions";

const STATUS: Record<SyncStatus, { label: string; className: string }> = {
  ok: { label: "Up to date", className: "text-emerald-600" },
  never_synced: { label: "Not synced yet", className: "text-muted-foreground" },
  needs_reconnect: { label: "Needs reconnect", className: "text-destructive" },
  no_accounts: { label: "No accounts connected", className: "text-muted-foreground" },
};
const SYNC_MESSAGE: Record<string, string> = {
  ok: "Sync finished.",
  partial: "Sync ran but didn't finish in time; it continues on the next sync.",
  throttled: "Facebook asked us to slow down; it will retry automatically.",
  failed: "We couldn't start the sync.",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") notFound(); // RLS would hide the data anyway; don't reveal the page either

  const today = manilaDate(new Date());
  const platform = sp.platform === "facebook" || sp.platform === "instagram" ? sp.platform : "all";
  const top: TopWindow = sp.top === "week" || sp.top === "month" ? sp.top : "all";
  const sort: SortKey = sp.sort === "reach" ? "reach" : "views";

  const [profiles, connections, videos] = await Promise.all([
    fetchAll<ProfileRow & { role: string }>((a, b) =>
      supabase.from("profiles").select("id, name, email, role").eq("role", "affiliate").order("created_at").range(a, b)),
    fetchAll<ConnectionSummaryRow>((a, b) =>
      supabase.from("connections").select("profile_id, platform, account_name, status, last_synced_at").order("created_at").range(a, b)),
    fetchAll<VideoStat>((a, b) =>
      supabase.from("videos_with_latest_metrics").select("*").order("published_at", { ascending: false }).order("id").range(a, b)),
  ]);

  const summaries = affiliateSummaries(profiles, connections, videos, { from: addDays(today, -29), to: today });
  const who = sp.who ? summaries.find((s) => s.profile.id === sp.who)?.profile : undefined;

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">All affiliates in one view. Dates are Philippine time.</p>
      </div>

      {sp.synced && (
        <p role="status" className="rounded-md border border-border p-3 text-sm">
          {who ? `${who.name || who.email}: ` : ""}{SYNC_MESSAGE[sp.synced] ?? SYNC_MESSAGE.failed}
        </p>
      )}

      <TopVideos
        heading="Leaderboard: top videos across all affiliates"
        videos={topVideos(videos, { platform, window: top, sort, today, limit: 25 })}
        platform={platform} window={top} sort={sort} keep={{}}
        basePath="/admin" showAffiliate
      />

      <section className="flex flex-col gap-3" aria-labelledby="affiliates-heading">
        <h2 id="affiliates-heading" className="text-lg font-semibold">Affiliates</h2>
        <p className="text-xs text-muted-foreground">
          Views and reach are for videos posted in the last 30 days. &ldquo;Last synced&rdquo; shows the oldest account.
        </p>
        {summaries.length === 0 ? (
          <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">No affiliates have signed up yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Connected accounts</th>
                  <th className="p-3">Sync status</th>
                  <th className="p-3 text-right">Views (30d)</th>
                  <th className="p-3 text-right">Reach (30d)</th>
                  <th className="p-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.profile.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <div className="font-medium">{s.profile.name || s.profile.email || "Unknown"}</div>
                      {s.profile.name && <div className="text-xs text-muted-foreground">{s.profile.email}</div>}
                    </td>
                    <td className="p-3">
                      {s.accounts.length === 0 ? "—" : (
                        <ul className="flex flex-col gap-0.5">
                          {s.accounts.map((a, i) => (
                            <li key={i}>
                              {a.name} <span className="text-xs text-muted-foreground">({a.platform === "facebook" ? "Facebook" : "Instagram"})</span>
                              {a.status === "needs_reconnect" && <span className="ml-1 text-xs text-destructive">needs reconnect</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-3">
                      <div className={cn("font-medium", STATUS[s.status].className)}>{STATUS[s.status].label}</div>
                      {s.lastSyncedAt && <div className="text-xs text-muted-foreground">Last synced {formatDate(s.lastSyncedAt)}</div>}
                    </td>
                    <td className="p-3 text-right tabular-nums">{formatNumber(s.views)}</td>
                    <td className="p-3 text-right tabular-nums">{formatNumber(s.reach)}</td>
                    <td className="p-3 text-right">
                      {s.accounts.length > 0 && (
                        <form action={resyncAffiliate}>
                          <input type="hidden" name="profile_id" value={s.profile.id} />
                          <Button type="submit" variant="outline" size="sm">Re-sync</Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
