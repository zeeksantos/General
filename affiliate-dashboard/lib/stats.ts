import { eachDay, inRange, manilaDate, monthStart, previousRange, weekStart, type Range } from "./dates.ts";

export type Platform = "facebook" | "instagram";

export type VideoStat = {
  id: string;
  profile_id?: string;   // owner (present on rows from videos_with_latest_metrics)
  profile_name?: string; // owner's display name, for admin views
  platform: Platform;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  media_type: string | null;
  published_at: string;
  duration_seconds: number | null;
  account_name: string;
  views: number;
  reach: number;
  link_clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avg_watch_time: number | null;
};

// Everything below counts a video in the period it was PUBLISHED, using its latest lifetime metrics.
// (Daily snapshots only exist from the first sync, so true in-period deltas aren't available yet.)

export type Kpis = { views: number; reach: number; link_clicks: number };

export function kpis(videos: VideoStat[], range: Range): Kpis {
  const out = { views: 0, reach: 0, link_clicks: 0 };
  for (const v of videos) {
    if (!inRange(v.published_at, range)) continue;
    out.views += v.views;
    out.reach += v.reach;
    out.link_clicks += v.link_clicks;
  }
  return out;
}

/** % change vs the previous equal-length period, or null when there is no baseline. */
export const pctChange = (current: number, previous: number): number | null =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;

export function kpiComparison(videos: VideoStat[], range: Range) {
  const current = kpis(videos, range);
  const previous = kpis(videos, previousRange(range));
  return {
    current,
    previous,
    change: {
      views: pctChange(current.views, previous.views),
      reach: pctChange(current.reach, previous.reach),
      link_clicks: pctChange(current.link_clicks, previous.link_clicks),
    },
  };
}

export type TrendPoint = {
  date: string;
  facebook_views: number; instagram_views: number;
  facebook_reach: number; instagram_reach: number;
};

export function trend(videos: VideoStat[], range: Range): TrendPoint[] {
  const byDay = new Map<string, TrendPoint>(
    eachDay(range).map((date) => [date, { date, facebook_views: 0, instagram_views: 0, facebook_reach: 0, instagram_reach: 0 }]),
  );
  for (const v of videos) {
    const p = byDay.get(manilaDate(new Date(v.published_at)));
    if (!p) continue;
    p[`${v.platform}_views`] += v.views;
    p[`${v.platform}_reach`] += v.reach;
  }
  return [...byDay.values()];
}

export type TopWindow = "week" | "month" | "all";
export type SortKey = "views" | "reach";

export function windowRange(window: TopWindow, today: string): Range | null {
  if (window === "week") return { from: weekStart(today), to: today }; // weeks start Monday
  if (window === "month") return { from: monthStart(today), to: today };
  return null;
}

export function topVideos(
  videos: VideoStat[],
  opts: { platform: Platform | "all"; window: TopWindow; sort: SortKey; today: string; limit?: number },
): VideoStat[] {
  const range = windowRange(opts.window, opts.today);
  return videos
    .filter((v) => (opts.platform === "all" || v.platform === opts.platform) && (!range || inRange(v.published_at, range)))
    .sort((a, b) => b[opts.sort] - a[opts.sort] || b.published_at.localeCompare(a.published_at))
    .slice(0, opts.limit ?? 20);
}

// ---- "Why it worked" ----------------------------------------------------

export type WhyItWorked = { hook: string; length: string; format: string; posted: string };

export function whyItWorked(v: VideoStat): WhyItWorked {
  const hook = (v.caption ?? "").split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "No caption";
  const secs = v.duration_seconds;
  const length = secs == null ? "Not available" : secs < 60 ? `${Math.round(secs)} sec` : `${Math.floor(secs / 60)} min ${Math.round(secs % 60)} sec`;
  const format = v.media_type === "reel" ? "Reel" : v.platform === "facebook" ? "Facebook video post" : "Instagram feed video";
  const posted = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila", weekday: "long", hour: "numeric", minute: "2-digit",
  }).format(new Date(v.published_at));
  return { hook, length, format, posted };
}


