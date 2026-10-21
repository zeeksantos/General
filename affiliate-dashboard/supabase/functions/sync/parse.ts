// Pure helpers (no Deno/Node APIs) so they can be unit-tested with `node --test`.

export type VideoMetrics = {
  views: number;
  reach: number;
  link_clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avg_watch_time: number | null;
};

export const emptyMetrics = (): VideoMetrics => ({
  views: 0, reach: 0, link_clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0, avg_watch_time: null,
});

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Manila is UTC+8, no DST

/** YYYY-MM-DD in Asia/Manila (week/month boundaries follow the Philippines, see CLAUDE.md). */
export function manilaDate(d: Date): string {
  return new Date(d.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start/end unix seconds of a Manila calendar day (YYYY-MM-DD). */
export function manilaDayRange(day: string): { since: number; until: number } {
  const since = Math.floor((Date.parse(`${day}T00:00:00Z`) - MANILA_OFFSET_MS) / 1000);
  return { since, until: since + 24 * 60 * 60 };
}

type InsightItem = {
  name: string;
  values?: { value: unknown }[];
  total_value?: { value: unknown };
};

/** Flattens a Graph `/insights` response into { metric: value }. Handles lifetime `values` and `total_value`. */
export function parseInsights(body: { data?: InsightItem[] } | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const item of body?.data ?? []) {
    const v = item.total_value?.value ?? item.values?.[0]?.value;
    if (v !== undefined) out[item.name] = v;
  }
  return out;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function instagramMetrics(raw: Record<string, unknown>): VideoMetrics {
  const ms = raw["ig_reels_avg_watch_time"];
  return {
    views: num(raw["views"]),
    reach: num(raw["reach"]),
    link_clicks: 0, // not available per post on Instagram
    likes: num(raw["likes"]),
    comments: num(raw["comments"]),
    shares: num(raw["shares"]),
    saves: num(raw["saved"]),
    avg_watch_time: typeof ms === "number" ? ms / 1000 : null, // API reports milliseconds
  };
}

export function facebookMetrics(
  raw: Record<string, unknown>,
  counts: { likes?: number; comments?: number; shares?: number } = {},
): VideoMetrics {
  const clicks = raw["post_clicks_by_type"];
  const linkClicks =
    clicks && typeof clicks === "object" ? num((clicks as Record<string, unknown>)["link clicks"]) : 0;
  return {
    views: num(raw["post_media_view"]),
    reach: num(raw["post_total_media_view_unique"]),
    link_clicks: linkClicks,
    likes: counts.likes ?? 0,
    comments: counts.comments ?? 0,
    shares: counts.shares ?? 0,
    saves: 0,
    avg_watch_time: null,
  };
}

// ---- rate limits -------------------------------------------------------

/** Graph error codes that mean "slow down", not "broken". */
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80000, 80001, 80002, 80003, 80004, 80005, 80006, 80008, 80009, 80014]);
export const isRateLimitCode = (code?: number) => code !== undefined && RATE_LIMIT_CODES.has(code);
export const isTokenCode = (code?: number, status?: number) => code === 190 || status === 401;

/** Highest usage % and any "come back in N minutes" hint from X-App-Usage / X-Business-Use-Case-Usage. */
export function parseUsage(headers: { get(name: string): string | null }): { pct: number; regainMinutes: number } {
  let pct = 0;
  let regain = 0;
  const bump = (o: Record<string, unknown>) => {
    for (const k of ["call_count", "total_cputime", "total_time"]) pct = Math.max(pct, num(o[k]));
    regain = Math.max(regain, num(o["estimated_time_to_regain_access"]));
  };
  const app = headers.get("x-app-usage");
  const buc = headers.get("x-business-use-case-usage");
  try {
    if (app) bump(JSON.parse(app));
    if (buc) {
      for (const entries of Object.values(JSON.parse(buc) as Record<string, Record<string, unknown>[]>)) {
        entries.forEach(bump);
      }
    }
  } catch {
    // Malformed header: ignore rather than fail the sync.
  }
  return { pct, regainMinutes: regain };
}
