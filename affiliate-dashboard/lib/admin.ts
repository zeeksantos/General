import { kpis, type VideoStat } from "./stats.ts";
import type { Range } from "./dates.ts";

export type ProfileRow = { id: string; name: string; email: string | null };
export type ConnectionSummaryRow = {
  profile_id: string;
  platform: "facebook" | "instagram";
  account_name: string;
  status: "active" | "needs_reconnect" | "disconnected";
  last_synced_at: string | null;
};
export type SyncStatus = "no_accounts" | "needs_reconnect" | "never_synced" | "ok";

export type AffiliateSummary = {
  profile: ProfileRow;
  accounts: { platform: "facebook" | "instagram"; name: string; status: ConnectionSummaryRow["status"] }[];
  status: SyncStatus;
  /** Oldest last-sync among active accounts, so a stale account isn't hidden by a fresh one. */
  lastSyncedAt: string | null;
  views: number;
  reach: number;
};

export function affiliateSummaries(
  profiles: ProfileRow[],
  connections: ConnectionSummaryRow[],
  videos: VideoStat[],
  range: Range,
): AffiliateSummary[] {
  return profiles
    .map((profile) => {
      const conns = connections.filter((c) => c.profile_id === profile.id);
      const active = conns.filter((c) => c.status === "active");
      const status: SyncStatus =
        conns.length === 0 ? "no_accounts"
        : conns.some((c) => c.status === "needs_reconnect") ? "needs_reconnect"
        : active.some((c) => c.last_synced_at === null) ? "never_synced"
        : "ok";
      const synced = active.map((c) => c.last_synced_at).filter((d): d is string => !!d).sort();
      const { views, reach } = kpis(videos.filter((v) => v.profile_id === profile.id), range);
      return {
        profile,
        accounts: conns.map((c) => ({ platform: c.platform, name: c.account_name, status: c.status })),
        status,
        lastSyncedAt: status === "never_synced" ? null : (synced[0] ?? null),
        views,
        reach,
      };
    })
    .sort((a, b) => b.views - a.views || (a.profile.name || a.profile.email || "").localeCompare(b.profile.name || b.profile.email || ""));
}
