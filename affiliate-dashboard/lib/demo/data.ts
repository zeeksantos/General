// Deterministic fake data for DEMO_MODE. No network, no database. Dates are relative to `now`
// so the demo always looks fresh. Never mixed with real data.
import type { ConnectionSummaryRow, ProfileRow } from "../admin.ts";
import { manilaDate, addDays } from "../dates.ts";
import type { VideoStat } from "../stats.ts";

export const DEMO_VIEWER_ID = "demo-1";

export type DemoConnection = ConnectionSummaryRow & { id: string };
export type DemoData = {
  profiles: ProfileRow[];
  connections: DemoConnection[];
  videos: VideoStat[];
  taps: { profile_id: string; date: string; taps: number }[];
};

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AFFILIATES = [
  { name: "Maria Santos", fb: "Maria Santos Reviews", ig: "maria.reviews" },
  { name: "Jun dela Cruz", fb: "Jun Finds", ig: "junfinds" },
  { name: "Aira Villanueva", fb: "Aira's Daily Hacks", ig: "aira.hacks" },
  { name: "Paolo Reyes", fb: "Paolo Unboxes", ig: "paolo.unboxes" },
  { name: "Kristine Lim", fb: "Kristine x Wellness", ig: "kristine.wellness" },
  { name: "Migs Aquino", fb: "Migs Tries It", ig: "migs.tries" },
];
// Demo-4's Instagram token "expired"; Demo-6 has only just connected and has not synced.
const IG_BROKEN = 3;
const NEVER_SYNCED = 5;

const HOOKS = [
  "Stop scrolling — this changed my mornings",
  "I tried it for 7 days so you don't have to",
  "3 things nobody tells you before buying",
  "POV: you finally found one that works",
  "Honest review after 30 days",
  "Wait for the result at the end",
  "This is your sign to start today",
  "Why is nobody talking about this?",
  "Unboxing the viral one everyone asked about",
  "Before and after — no filter",
  "Here's how I use it every single day",
  "The mistake I made so you don't have to",
];
const TAGS = ["#fyp #review", "#unboxing #finds", "#dailyroutine", "#honestreview", "#tryitwithme"];

function thumbnail(rng: () => number): string {
  const h1 = Math.floor(rng() * 360);
  const h2 = (h1 + 40 + Math.floor(rng() * 80)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 70% 55%)"/>` +
    `<stop offset="1" stop-color="hsl(${h2} 70% 40%)"/></linearGradient></defs>` +
    `<rect width="128" height="128" fill="url(#g)"/><path d="M52 40l36 24-36 24z" fill="white" fill-opacity=".85"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function demoData(now: Date = new Date()): DemoData {
  const rng = mulberry32(20261021);
  const randn = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const pick = <T,>(xs: T[]) => xs[Math.floor(rng() * xs.length)];

  const profiles: ProfileRow[] = AFFILIATES.map((a, i) => ({
    id: `demo-${i + 1}`,
    name: a.name,
    email: `${a.name.toLowerCase().replace(/[^a-z]+/g, ".")}@demo.example`,
  }));

  const connections: DemoConnection[] = [];
  const videos: VideoStat[] = [];
  const taps: DemoData["taps"] = [];

  AFFILIATES.forEach((a, i) => {
    const profile_id = `demo-${i + 1}`;
    const syncedAt = new Date(now.getTime() - (2 + i) * 3_600_000).toISOString();
    for (const platform of ["facebook", "instagram"] as const) {
      connections.push({
        id: `demo-conn-${i + 1}-${platform}`,
        profile_id,
        platform,
        account_name: platform === "facebook" ? a.fb : `@${a.ig}`,
        status: i === IG_BROKEN && platform === "instagram" ? "needs_reconnect" : "active",
        last_synced_at: i === NEVER_SYNCED ? null : syncedAt,
      });
    }
    if (i === NEVER_SYNCED) return;

    const quality = 0.6 + rng() * 1.2; // some creators are simply better
    for (const platform of ["facebook", "instagram"] as const) {
      const count = 16 + Math.floor(rng() * 20);
      for (let n = 0; n < count; n++) {
        const ageDays = rng() * 89;
        const hour = Math.floor(11 + rng() * 11); // Manila 11:00–22:00, evenings are common
        const published = new Date(now.getTime() - ageDays * 86_400_000);
        published.setUTCHours((hour - 8 + 24) % 24, Math.floor(rng() * 60));
        if (published > now) published.setTime(now.getTime() - 3_600_000);
        const isReel = platform === "instagram" && rng() < 0.7;

        const maturity = 1 - Math.exp(-ageDays / 4); // brand-new posts haven't collected much yet
        const base = Math.exp(8.1 + randn() * 1.1) * quality * (isReel ? 2.4 : 1) * (0.35 + 0.65 * maturity);
        const views = Math.round(base);
        const reach = Math.round(views * (0.55 + rng() * 0.3));
        const engagement = 0.03 + rng() * 0.07;
        const secs = isReel ? 12 + Math.round(rng() * 45) : 20 + Math.round(rng() * 160);
        videos.push({
          id: `demo-v-${i + 1}-${platform}-${n}`,
          profile_id,
          profile_name: a.name,
          platform,
          caption: `${pick(HOOKS)}\n${pick(TAGS)}`,
          permalink: `https://example.com/demo/${profile_id}/${platform}/${n}`,
          thumbnail_url: thumbnail(rng),
          media_type: isReel ? "reel" : "video",
          published_at: published.toISOString(),
          duration_seconds: platform === "facebook" ? secs : null, // Instagram doesn't return length
          account_name: platform === "facebook" ? a.fb : `@${a.ig}`,
          views,
          reach,
          link_clicks: platform === "facebook" ? Math.round(views * (0.005 + rng() * 0.025)) : 0,
          likes: Math.round(views * engagement),
          comments: Math.round(views * engagement * 0.08),
          shares: Math.round(views * engagement * 0.15),
          saves: platform === "instagram" ? Math.round(views * engagement * 0.2) : 0,
          avg_watch_time: isReel ? Math.round((3 + rng() * 9) * 10) / 10 : null,
        });
      }
    }
    const today = manilaDate(now);
    for (let d = 0; d < 30; d++) taps.push({ profile_id, date: addDays(today, -d), taps: Math.round(rng() * 14 * quality) });
  });

  videos.sort((x, y) => y.published_at.localeCompare(x.published_at));
  return { profiles, connections, videos, taps };
}
