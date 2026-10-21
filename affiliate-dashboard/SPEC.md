# Affiliate / UGC Video Performance Dashboard — Build Spec

Project brief for Claude Code. Build the app from this spec, phase by phase (see section 9).

## 1. Goal
A web app where each affiliate / UGC creator logs in, connects **their own Facebook Page and Instagram professional account**, and sees which of their videos perform best — overall, per platform, per week and per month. Z-Fast (admin) can see all affiliates in one view.

## 2. Users & roles
- **Affiliate** — signs up, connects FB Page + IG, sees only their own data.
- **Admin (Z-Fast)** — sees every affiliate, leaderboard across creators, can trigger re-sync.

## 3. Stack
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, charts with Recharts
- Supabase: Auth (email magic link), Postgres with Row Level Security, Vault (or pgsodium) for encrypted Meta tokens, scheduled sync via Supabase Cron + Edge Function
- Vercel for hosting
- Meta Graph API — pin the latest version (v25.0+ at time of writing) in one config constant

## 4. Meta integration
**Connection flow (Facebook Login for Business):**
1. Affiliate clicks "Connect Facebook & Instagram".
2. Request permissions: `pages_show_list`, `pages_read_engagement`, `read_insights`, `instagram_basic`, `instagram_manage_insights`, `business_management`.
3. Exchange the short-lived user token for a long-lived one (~60 days).
4. `GET /me/accounts` → let the affiliate pick their Page → store the Page access token (Page tokens derived from a long-lived user token don't expire under normal conditions).
5. `GET /{page-id}?fields=instagram_business_account` → store the IG user ID.
6. Show an error state if the IG account is personal (insights only work for Business/Creator accounts linked to a Page).

**Requirements outside the code (owner: Zeek):**
- Create a Meta Developer app (Business type), add Facebook Login for Business.
- Until App Review is approved, only users added as app testers/developers can connect. Plan for **App Review + Business Verification** before onboarding real affiliates (needs privacy policy URL, data deletion URL, screencast of the flow).

## 5. Metrics (current names — Meta deprecated impressions/plays)
Verify every metric against the docs for the pinned version before coding; Meta has been retiring metrics through 2025–2026.

**Instagram media** — `GET /{ig-media-id}/insights`
- `views` (replaced impressions/plays), `reach`, `likes`, `comments`, `shares`, `saved`, `total_interactions`
- Reels extras: `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`
- Media fields: `id, caption, media_type, media_product_type, permalink, thumbnail_url, timestamp`

**Facebook Page posts / videos**
- Views: `post_media_view`
- Reach: `post_total_media_view_unique` (replaces `post_impressions_unique`)
- Link clicks: `post_clicks_by_type` → `link clicks`
- Video posts: pull from `/{page-id}/videos` and `/{page-id}/posts`, dedupe by post ID

**Link clicks caveat:** per-post link clicks exist on Facebook. Instagram has no per-video link-click metric for organic posts; show IG link activity at account level (profile link taps) and label it clearly.

## 6. Data model (Postgres)
- `profiles` (id, name, role: affiliate|admin)
- `connections` (id, profile_id, platform: facebook|instagram, external_account_id, account_name, token_encrypted, token_expires_at, status, last_synced_at)
- `videos` (id, connection_id, platform, external_id, caption, permalink, thumbnail_url, media_type, published_at)
- `video_metrics_daily` (video_id, date, views, reach, link_clicks, likes, comments, shares, saves, avg_watch_time) — one snapshot per day so weekly/monthly deltas are possible
- RLS: affiliates read only rows tied to their own `profile_id`; admin reads all

## 7. Sync job
- Runs daily (and on demand from the UI): for each active connection, fetch videos published in the last 90 days + their lifetime insights, upsert into `videos` and `video_metrics_daily`.
- First connect: backfill 90 days.
- Respect rate limits (read `X-Business-Use-Case-Usage` / `X-App-Usage` headers, back off).
- Mark connection `needs_reconnect` on token errors and show a banner to the affiliate.

## 8. Dashboard screens
**Affiliate home**
- KPI cards: total views, total reach, total link clicks — with period selector (7d / 30d / this month / custom) and % change vs previous period
- Trend line: views & reach over time, FB vs IG
- **Top videos** table/grid with thumbnail, caption, platform badge, published date, views, reach, link clicks, link to post
  - Tabs: **All / Facebook / Instagram**
  - Toggle: **This week / This month / All time**
  - Sort by **Views** (default) or **Reach**
- "Why it worked" panel per video: hook text (first line of caption), length, format (Reel/feed/video), posting day/time

**Admin view**
- Leaderboard of top videos across all affiliates (same filters)
- Per-affiliate summary table: connected accounts, sync status, 30-day views/reach
- Re-sync button per affiliate

## 9. Build phases
1. Scaffold Next.js + Supabase, auth, schema + RLS
2. Meta connect flow + encrypted token storage
3. Sync Edge Function + cron + 90-day backfill
4. Affiliate dashboard (KPIs, trends, top videos with platform/week/month filters)
5. Admin view + leaderboard
6. Demo mode with seeded fake data (so the UI can be built and shown before App Review is approved)
7. Privacy policy + data deletion callback pages (required for App Review), deploy to Vercel

## 10. Out of scope for v1
TikTok / YouTube Shorts, paid ad metrics, affiliate commission/sales tracking. Design the `platform` field so TikTok can be added later.
