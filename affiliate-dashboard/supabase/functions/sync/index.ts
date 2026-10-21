// Supabase Edge Function: syncs Facebook/Instagram videos + insights into Postgres.
// Invoked daily by pg_cron and on demand by the app, both with the `x-sync-secret` header
// (verified against the Vault secret `sync_secret` via public.check_sync_secret).
// Body (all optional): { connection_id?: string, profile_id?: string, source?: "manual" }
// Every connection's result is recorded in public.sync_runs (shown on /admin/sync-log).
import { createClient } from "npm:@supabase/supabase-js@2";
import { insightsTolerant, graphGet, MetaError, paginate, ThrottledError } from "./meta.ts";
import {
  facebookMetrics, instagramMetrics, manilaDate, manilaDayRange, parseInsights, type VideoMetrics,
} from "./parse.ts";

const WINDOW_DAYS = 90;           // SPEC §7
const ACCOUNT_BACKFILL_DAYS = 30; // per-day IG link-tap calls; bounded to keep the first sync fast
const TIME_BUDGET_MS = 120_000;   // Edge Functions have a wall-clock limit
const CONCURRENCY = 5;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Conn = {
  id: string; profile_id: string; platform: "facebook" | "instagram"; external_account_id: string;
  token_secret_id: string | null; last_synced_at: string | null;
};
const LOG_RETENTION_DAYS = 30;
const MAX_LOGGED_WARNINGS = 20;
type VideoRow = {
  external_id: string; caption: string | null; permalink: string | null; thumbnail_url: string | null;
  media_type: string; published_at: string; duration_seconds?: number | null;
};
type Item = { video: VideoRow; fetchMetrics: () => Promise<VideoMetrics> };

Deno.serve(async (req) => {
  // Callers prove they know the shared secret kept in Vault (checked in SQL, see migration 20261021000700).
  const given = req.headers.get("x-sync-secret") ?? "";
  const { data: ok } = given ? await db.rpc("check_sync_secret", { p_given: given }) : { data: false };
  if (ok !== true) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const deadline = Date.now() + TIME_BUDGET_MS;

  const source = body.source === "manual" ? "manual" : "cron";

  // Only accounts that are approved and not suspended are synced.
  let q = db.from("connections")
    .select("id, profile_id, platform, external_account_id, token_secret_id, last_synced_at, profiles!inner(status)")
    .eq("status", "active").eq("profiles.status", "active").order("last_synced_at", { ascending: true, nullsFirst: true });
  if (body.connection_id) q = q.eq("id", body.connection_id);
  if (body.profile_id) q = q.eq("profile_id", body.profile_id);
  const { data: conns, error } = await q;
  if (error) return Response.json({ error: "Could not load connections" }, { status: 500 });

  const results = [];
  for (const conn of (conns ?? []) as Conn[]) {
    const started = Date.now();
    if (started > deadline) {
      const skipped = { connection_id: conn.id, platform: conn.platform, status: "skipped_time_budget", videos: 0, warnings: [] as string[] };
      results.push(skipped);
      await logRun(conn, source, skipped, 0);
      continue;
    }
    const r = await syncConnection(conn, deadline);
    results.push(r);
    await logRun(conn, source, r, Date.now() - started);
    if (r.status === "throttled") break; // Meta limits are app/page wide: stop the whole run
  }

  // Keep the log small: drop rows older than the retention window.
  await db.from("sync_runs").delete().lt("started_at", new Date(Date.now() - LOG_RETENTION_DAYS * 86_400_000).toISOString());
  return Response.json({ results });
});

async function logRun(
  conn: Conn, source: string,
  r: { status: string; platform?: string; videos: number; warnings: string[] }, durationMs: number,
) {
  // A logging failure must never break the sync itself.
  const { error } = await db.from("sync_runs").insert({
    source, connection_id: conn.id, profile_id: conn.profile_id, platform: conn.platform, status: r.status,
    videos: r.videos, warnings: r.warnings.slice(0, MAX_LOGGED_WARNINGS).map((w) => String(w).slice(0, 300)),
    duration_ms: durationMs,
  });
  if (error) console.error("could not log sync run:", error.message);
}

async function syncConnection(conn: Conn, deadline: number) {
  const warnings: string[] = [];
  const result = { connection_id: conn.id, platform: conn.platform, status: "ok", videos: 0, warnings };
  try {
    if (!conn.token_secret_id) throw new MetaError("No token stored", 190);
    const { data: token, error } = await db.rpc("read_token", { p_id: conn.token_secret_id });
    if (error || !token) throw new MetaError("Token unreadable", 190);

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
    const items = conn.platform === "instagram"
      ? await collectInstagram(conn, token, since, warnings)
      : await collectFacebook(conn, token, since, warnings);

    const today = manilaDate(new Date());
    let complete = true;
    const videoIds = await upsertVideos(conn, items.map((i) => i.video));

    for (let i = 0; i < items.length; i += CONCURRENCY) {
      if (Date.now() > deadline) { complete = false; break; }
      const batch = items.slice(i, i + CONCURRENCY);
      const rows = await Promise.all(batch.map(async (it) => {
        const m = await it.fetchMetrics();
        return { video_id: videoIds.get(it.video.external_id)!, date: today, ...m };
      }));
      const { error: mErr } = await db.from("video_metrics_daily").upsert(rows, { onConflict: "video_id,date" });
      if (mErr) throw new Error("metrics upsert failed");
      result.videos += rows.length;
    }

    if (conn.platform === "instagram") await syncProfileLinkTaps(conn, token, conn.last_synced_at === null, warnings);

    if (complete) {
      await db.from("connections").update({ last_synced_at: new Date().toISOString() }).eq("id", conn.id);
    } else {
      result.status = "partial"; // last_synced_at untouched so it is picked first next run
    }
  } catch (e) {
    if (e instanceof ThrottledError) {
      result.status = "throttled";
      warnings.push(e.message);
    } else if (e instanceof MetaError && e.isToken) {
      await db.from("connections").update({ status: "needs_reconnect" }).eq("id", conn.id);
      result.status = "needs_reconnect";
    } else {
      // Never include tokens in logs/results; Meta error messages don't contain them.
      result.status = "error";
      warnings.push(e instanceof Error ? e.message : "unknown error");
      console.error(`sync failed for connection ${conn.id}:`, e instanceof Error ? e.message : e);
    }
  }
  return result;
}

async function upsertVideos(conn: Conn, videos: VideoRow[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let i = 0; i < videos.length; i += 200) {
    const chunk = videos.slice(i, i + 200).map((v) => ({ ...v, connection_id: conn.id, platform: conn.platform }));
    const { data, error } = await db.from("videos").upsert(chunk, { onConflict: "connection_id,external_id" })
      .select("id, external_id");
    if (error) throw new Error("videos upsert failed");
    data!.forEach((r: { id: string; external_id: string }) => map.set(r.external_id, r.id));
  }
  return map;
}

// ---------------------------------------------------------------- Instagram
const IG_METRICS = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions"];
const IG_REEL_METRICS = ["ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];

async function collectInstagram(conn: Conn, token: string, since: Date, warnings: string[]): Promise<Item[]> {
  const items: Item[] = [];
  const media = paginate<any>(`${conn.external_account_id}/media`, {
    fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp", limit: "50",
  }, token);
  for await (const m of media) {
    if (new Date(m.timestamp) < since) break; // newest first
    if (m.media_type !== "VIDEO") continue;   // photos/carousels are not videos
    const isReel = m.media_product_type === "REELS";
    items.push({
      video: {
        external_id: m.id, caption: m.caption ?? null, permalink: m.permalink ?? null,
        thumbnail_url: m.thumbnail_url ?? null, media_type: isReel ? "reel" : "video", published_at: m.timestamp,
      },
      fetchMetrics: async () => {
        const raw = await insightsTolerant(`${m.id}/insights`, IG_METRICS, {}, token, parseInsights, warnings);
        if (isReel) {
          Object.assign(raw, await insightsTolerant(`${m.id}/insights`, IG_REEL_METRICS, {}, token, parseInsights, warnings));
        }
        return instagramMetrics(raw);
      },
    });
  }
  return items;
}

/** Account-level (not per video): taps on the profile link, one value per Manila day. */
async function syncProfileLinkTaps(conn: Conn, token: string, backfill: boolean, warnings: string[]) {
  const days = backfill ? ACCOUNT_BACKFILL_DAYS : 2;
  const rows = [];
  for (let d = 0; d < days; d++) {
    const day = manilaDate(new Date(Date.now() - d * 86_400_000));
    const { since, until } = manilaDayRange(day);
    try {
      const body = await graphGet(`${conn.external_account_id}/insights`, {
        metric: "profile_links_taps", metric_type: "total_value", period: "day",
        since: String(since), until: String(until),
      }, token);
      const v = parseInsights(body)["profile_links_taps"];
      rows.push({ connection_id: conn.id, date: day, profile_link_taps: typeof v === "number" ? v : 0 });
    } catch (e) {
      if (!(e instanceof MetaError) || e.isToken) throw e;
      warnings.push(`profile_links_taps unavailable: ${e.message}`);
      return;
    }
  }
  if (rows.length) await db.from("account_metrics_daily").upsert(rows, { onConflict: "connection_id,date" });
}

// ----------------------------------------------------------------- Facebook
const FB_METRICS = ["post_media_view", "post_total_media_view_unique", "post_clicks_by_type"];

async function collectFacebook(conn: Conn, token: string, since: Date, warnings: string[]): Promise<Item[]> {
  const sinceTs = String(Math.floor(since.getTime() / 1000));
  const byId = new Map<string, Item>();
  const targetToPost = new Map<string, string>(); // video node id -> post id already covered by a post

  const fetchMetrics = (id: string, counts: { likes?: number; comments?: number; shares?: number }) => async () => {
    const raw = await insightsTolerant(`${id}/insights`, FB_METRICS, { period: "lifetime" }, token, parseInsights, warnings);
    return facebookMetrics(raw, counts);
  };

  // 1) Page posts that carry a video attachment (post id is the canonical external id).
  const posts = paginate<any>(`${conn.external_account_id}/posts`, {
    fields: "id,message,permalink_url,full_picture,created_time,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),attachments{media_type,type,target{id}}",
    since: sinceTs, limit: "50",
  }, token);
  for await (const p of posts) {
    const att = (p.attachments?.data ?? []).find((a: any) => a.media_type === "video" || a.type?.includes("video"));
    if (!att) continue;
    if (att.target?.id) targetToPost.set(att.target.id, p.id);
    byId.set(p.id, {
      video: {
        external_id: p.id, caption: p.message ?? null, permalink: p.permalink_url ?? null,
        thumbnail_url: p.full_picture ?? null, media_type: "video", published_at: p.created_time,
      },
      fetchMetrics: fetchMetrics(p.id, {
        likes: p.reactions?.summary?.total_count, comments: p.comments?.summary?.total_count, shares: p.shares?.count,
      }),
    });
  }

  // 2) Page videos edge: adds duration, and any video the posts feed did not surface. Deduped by id.
  const videos = paginate<any>(`${conn.external_account_id}/videos`, {
    fields: "id,description,permalink_url,picture,created_time,length", since: sinceTs, limit: "50",
  }, token);
  for await (const v of videos) {
    const permalink = v.permalink_url ? `https://www.facebook.com${v.permalink_url}` : null;
    const postId = targetToPost.get(v.id);
    if (postId) {
      byId.get(postId)!.video.duration_seconds = v.length ?? null;
      continue;
    }
    if (byId.has(v.id)) continue;
    warnings.push(`video ${v.id} has no matching post; insights use the video id and may be empty`);
    byId.set(v.id, {
      video: {
        external_id: v.id, caption: v.description ?? null, permalink, thumbnail_url: v.picture ?? null,
        media_type: "video", published_at: v.created_time, duration_seconds: v.length ?? null,
      },
      fetchMetrics: fetchMetrics(v.id, {}),
    });
  }
  return [...byId.values()];
}
