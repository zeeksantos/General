import { createClient } from "@/lib/supabase/server";
import { ConnectionsCard, type ConnectionRow } from "@/components/connections-card";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { TopVideos } from "@/components/dashboard/top-videos";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { manilaDate, resolveRange } from "@/lib/dates";
import { kpiComparison, topVideos, trend, type SortKey, type TopWindow, type VideoStat } from "@/lib/stats";

const ERRORS: Record<string, string> = {
  denied: "Facebook login was cancelled or not approved. Please try again.",
  state: "That login attempt expired or didn't start here. Please try again.",
  exchange: "We couldn't finish connecting to Facebook. Please try again.",
  expired: "Your connection session expired. Please start again.",
  page: "We couldn't find that Page. Please try again.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { connect_error, connected, synced } = sp;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = manilaDate(new Date());
  const { kind, range } = resolveRange(sp.range, today, sp.from, sp.to);
  const platform = ["facebook", "instagram"].includes(sp.platform ?? "") ? sp.platform! : "all";
  const top: TopWindow = sp.top === "week" || sp.top === "month" ? sp.top : "all";
  const sort: SortKey = sp.sort === "reach" ? "reach" : "views";
  const periodParams: Record<string, string> = { range: kind, ...(kind === "custom" ? { from: range.from, to: range.to } : {}) };
  // Own videos only: admins can read every row via RLS, but this page is the personal view.
  const { data: videoRows } = await supabase
    .from("videos_with_latest_metrics")
    .select("*")
    .eq("profile_id", user!.id)
    .order("published_at", { ascending: false })
    .limit(1000);
  const videos = (videoRows ?? []) as VideoStat[];
  const hasInstagram = (await supabase.from("connections").select("id").eq("platform", "instagram").eq("profile_id", user!.id).limit(1)).data?.length;
  let igProfileTaps: number | null = null;
  if (hasInstagram) {
    const { data: taps } = await supabase
      .from("account_metrics_daily").select("profile_link_taps, connections!inner(profile_id)")
      .eq("connections.profile_id", user!.id).gte("date", range.from).lte("date", range.to);
    igProfileTaps = (taps ?? []).reduce((n, r) => n + Number(r.profile_link_taps), 0);
  }
  const { current, change } = kpiComparison(videos, range);
  const { data } = await supabase
    .from("connections")
    .select("id, platform, account_name, status, last_synced_at")
    .order("created_at");
  const connections = (data ?? []) as ConnectionRow[];
  const needsReconnect = connections.some((c) => c.status === "needs_reconnect");

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      {needsReconnect && (
        <p role="alert" className="max-w-xl rounded-md border border-destructive p-3 text-sm text-destructive">
          One of your accounts lost its connection to Facebook. Please reconnect so your stats keep updating.
        </p>
      )}
      {connect_error && (
        <p role="alert" className="max-w-xl rounded-md border border-destructive p-3 text-sm text-destructive">
          {ERRORS[connect_error] ?? ERRORS.exchange}
        </p>
      )}
      {connected === "no_instagram" && (
        <p role="status" className="max-w-xl rounded-md border border-border p-3 text-sm">
          Your Facebook Page is connected, but it has no Instagram professional account linked. Instagram
          stats only work for Business or Creator accounts connected to your Page — switch your Instagram
          account type, link it to the Page, then reconnect.
        </p>
      )}
      {connected === "connected" && (
        <p role="status" className="max-w-xl rounded-md border border-border p-3 text-sm">
          Connected! Your videos will show up after the first sync.
        </p>
      )}
      {synced && (
        <p role="status" className="max-w-xl rounded-md border border-border p-3 text-sm">
          {{
            ok: "Sync finished.",
            partial: "Sync ran but didn't finish in time. It will continue on the next sync.",
            throttled: "Facebook asked us to slow down. We'll try again automatically.",
            failed: "We couldn't start the sync. Please try again later.",
          }[synced] ?? "Sync finished."}
        </p>
      )}
      <ConnectionsCard connections={connections} />
      {connections.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <PeriodSelector active={kind} from={range.from} to={range.to} keep={{ platform, top, sort }} />
            <p className="text-xs text-muted-foreground">
              Showing videos posted {range.from} to {range.to}, compared with the same number of days before. Dates are Philippine time.
            </p>
          </div>
          <KpiCards current={current} change={change} igProfileTaps={igProfileTaps} />
          <TrendChart data={trend(videos, range)} />
          <TopVideos
            videos={topVideos(videos, { platform: platform as "all" | "facebook" | "instagram", window: top, sort, today })}
            platform={platform} window={top} sort={sort} keep={periodParams}
          />
        </>
      )}
    </div>
  );
}
