import { redirect } from "next/navigation";
import { ConnectionsCard } from "@/components/connections-card";
import { AccountsBar } from "@/components/dashboard/accounts-bar";
import { Notice } from "@/components/notice";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { TopVideos } from "@/components/dashboard/top-videos";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { manilaDate, resolveRange } from "@/lib/dates";
import { loadMyData } from "@/lib/data";
import { kpiComparison, topVideos, trend, trendBucket, type SortKey, type TopWindow } from "@/lib/stats";
import { getViewer } from "@/lib/viewer";

const ERRORS: Record<string, string> = {
  denied: "Facebook login was cancelled or not approved. Please try again.",
  state: "That login attempt expired or didn't start here. Please try again.",
  exchange: "We couldn't finish connecting to Facebook. Please try again.",
  expired: "Your connection session expired. Please start again.",
  page: "We couldn't find that Page. Please try again.",
  demo: "Demo mode: connecting a real account is turned off. This is sample data.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { connect_error, connected, synced } = sp;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const today = manilaDate(new Date());
  const { kind, range } = resolveRange(sp.range, today, sp.from, sp.to);
  const platform = ["facebook", "instagram"].includes(sp.platform ?? "") ? sp.platform! : "all";
  const top: TopWindow = sp.top === "week" || sp.top === "month" ? sp.top : "all";
  const sort: SortKey = sp.sort === "reach" ? "reach" : "views";
  const periodParams: Record<string, string> = { range: kind, ...(kind === "custom" ? { from: range.from, to: range.to } : {}) };
  const { connections, videos, igProfileTaps } = await loadMyData(viewer.id, range);
  const { current, change } = kpiComparison(videos, range);
  const needsReconnect = connections.some((c) => c.status === "needs_reconnect");
  const firstName = viewer.name.trim().split(/\s+/)[0];
  const synced_ok = connections.some((c) => c.last_synced_at);

  return (
    <div className="flex max-w-6xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{firstName ? `Hi, ${firstName}` : "Your videos"}</h1>
          <p className="text-sm text-muted-foreground">
            {connections.length > 0 ? "Here's how your videos are doing." : "Connect your accounts to see which of your videos perform best."}
          </p>
        </div>
        {connections.length > 0 && <PeriodSelector active={kind} from={range.from} to={range.to} keep={{ platform, top, sort }} />}
      </header>

      {needsReconnect && (
        <Notice kind="error">
          One of your accounts lost its connection to Facebook. Open <strong>Manage</strong> below and press <strong>Reconnect</strong> so your stats keep updating.
        </Notice>
      )}
      {connect_error && <Notice kind="error">{ERRORS[connect_error] ?? ERRORS.exchange}</Notice>}
      {connected === "no_instagram" && (
        <Notice>
          Your Facebook Page is connected, but it has no Instagram professional account linked. Instagram stats only work for
          Business or Creator accounts connected to your Page. Switch your Instagram account type, link it to the Page, then reconnect.
        </Notice>
      )}
      {connected === "connected" && <Notice kind="success">Connected! Your videos will show up after the first sync.</Notice>}
      {synced && (
        <Notice kind={synced === "ok" ? "success" : synced === "failed" ? "error" : "info"}>
          {{
            ok: "Sync finished.",
            partial: "Sync ran but didn't finish in time. It will continue on the next sync.",
            throttled: "Facebook asked us to slow down. We'll try again automatically.",
            failed: "We couldn't start the sync. Please try again later.",
          }[synced] ?? "Sync finished."}
        </Notice>
      )}

      {connections.length === 0 ? (
        <ConnectionsCard connections={connections} />
      ) : (
        <>
          <AccountsBar connections={connections} />
          {videos.length === 0 ? (
            <Notice>
              {synced_ok
                ? "We haven't found any videos from the last 90 days on your connected accounts yet. Post a video, then press Sync now."
                : "Your accounts are connected. Press Sync now to load your videos. The first sync can take a minute."}
            </Notice>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Showing videos posted {range.from} to {range.to}, compared with the same number of days before. Dates are Philippine time.
              </p>
              <KpiCards current={current} change={change} igProfileTaps={igProfileTaps} />
              <TrendChart data={trend(videos, range)} bucket={trendBucket(range)} />
              <TopVideos
                videos={topVideos(videos, { platform: platform as "all" | "facebook" | "instagram", window: top, sort, today })}
                platform={platform} window={top} sort={sort} keep={periodParams}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
