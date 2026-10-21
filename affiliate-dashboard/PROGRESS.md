# Progress

- [x] **1. Scaffold Next.js + Supabase, auth, schema + RLS**
- [x] **2.** Meta connect flow + encrypted token storage
- [x] **3.** Sync Edge Function + cron + 90-day backfill
- [x] **4.** Affiliate dashboard (KPIs, trends, top videos with platform/week/month filters)
- [x] **5.** Admin view + leaderboard
- [x] **6.** Demo mode with seeded fake data
- [x] **7.** Privacy policy + data deletion callback pages, deploy to Vercel

## Phase 1 notes
- Magic-link auth: `/login` -> `/auth/callback`; `proxy.ts` (Next 16's replacement for `middleware.ts`) refreshes the session and redirects unauthenticated users to `/login`.
- Schema in `supabase/migrations/20261021000000_initial_schema.sql`. Deviation from SPEC §6: `connections.token_encrypted` is `token_secret_id` (a Supabase Vault secret id) — the token itself is never stored in the table. Wired up in Phase 2.
- Admins are promoted manually: `update public.profiles set role = 'admin' where id = '<uuid>';`
- shadcn/ui: the CLI couldn't reach ui.shadcn.com from the sandbox, so `components.json` and the base components (button, input, card) were written by hand. Re-run `npx shadcn add ...` locally for more.
- Not yet verified against a live Supabase project (migration not applied; no keys in this environment).

## Phase 2 notes
- Flow: `/api/meta/connect` (sets CSRF `state` cookie, redirects to Facebook) -> `/api/meta/callback` (verifies state, code -> short-lived -> long-lived user token, parks it in Vault, cookie holds only the secret id) -> `/connect/pick` (choose a Page) -> Page token stored in Vault; one `facebook` and (if linked) one `instagram` connection row, both using the Page token.
- Migration `20261021000100_vault_token_functions.sql`: `store_token` / `read_token` / `delete_token`, executable by `service_role` only. Tokens are never selectable by clients (column grants from Phase 1) and the Graph client sends them in the `Authorization` header.
- No IG business account on the Page -> Facebook connects, dashboard shows a notice explaining Business/Creator requirement.
- `lib/meta/graph.ts` exposes `MetaApiError.isTokenError` (code 190 / 401) for the sync job to mark `needs_reconnect` (Phase 3).
- Not yet tested end-to-end: needs Supabase project + Meta app (Business type, Facebook Login for Business config with the SPEC §4 permissions, redirect URI `<SITE_URL>/api/meta/callback`, your account added as app tester) and the env vars in `.env.example`.
- Page tokens: stored with `token_expires_at = null` (non-expiring when derived from a long-lived user token).

## Phase 3 notes
- `supabase/functions/sync/` (Deno): `index.ts` (orchestration), `meta.ts` (Graph client, rate-limit backoff, tolerant insights), `parse.ts` (pure helpers, unit-tested: `npm test`).
- Auth: `x-sync-secret` header == `SYNC_SECRET` function secret (`verify_jwt = false` in `supabase/config.toml`). Body `{connection_id?, profile_id?}`; no body = all active connections.
- Per connection: videos from the last 90 days (IG: VIDEO media only; FB: posts with a video attachment + `/videos`, deduped by post id) -> upsert `videos`; lifetime insights -> one `video_metrics_daily` row per Manila day. `last_synced_at` is only set when a run completes, so partial runs are retried first. Oldest-last ordering means a very large first sync could repeat the newest videos each run (time budget 120s).
- Rate limits: reads `X-App-Usage` / `X-Business-Use-Case-Usage`; sleeps at >=70%, stops the run at >=90% or when Meta gives a regain time or a rate-limit error code (status `throttled`, retried next run). Token errors (code 190 / 401) set `needs_reconnect`.
- IG link activity: `account_metrics_daily.profile_link_taps` (account-level, last 30 days on first sync, 2 days after). IG per-video `link_clicks` is always 0 by design — label it in the UI (Phase 4).
- Migration `20261021000200_sync_support.sql` adds `videos.duration_seconds`, `account_metrics_daily`, and a pg_cron job at 19:00 UTC (03:00 Manila).
- "Sync now" button on the dashboard (server action, scoped to the signed-in user).
- Single Graph version constant: the function imports `lib/meta/config.ts` by relative path (the Supabase CLI bundles it on `supabase functions deploy sync`).

### Deploy checklist (owner: Zeek)
1. `supabase db push` (migrations) — enables pg_cron/pg_net.
2. `supabase secrets set SYNC_SECRET=<random>`; `supabase functions deploy sync`.
3. SQL editor: create Vault secrets `sync_function_url` and `sync_secret` (see comments in the cron migration).
4. Add the same `SYNC_SECRET` to `.env.local` / Vercel.

### Unverified (no access to Meta docs or a live account from the build sandbox)
- Metric names are from SPEC §5 and were NOT checked against the v25.0 docs: IG `views, reach, likes, comments, shares, saved, total_interactions, ig_reels_avg_watch_time, ig_reels_video_view_total_time, profile_links_taps`; FB `post_media_view, post_total_media_view_unique, post_clicks_by_type`. Unsupported metrics are skipped individually and reported in the function's `warnings`, so a retired metric degrades to 0 rather than failing the sync — check `warnings` on the first real run.
- Facebook `/posts` attachment shape (`attachments{media_type,target{id}}`) and the key `"link clicks"` in `post_clicks_by_type` are from the spec/memory. The Deno code was only type-checked (with stubs) and its pure logic unit-tested; it has never run against Supabase or Meta.

## Phase 4 notes
- Dashboard (`/dashboard`) is driven by URL params, rendered on the server (no client state): `range=7d|30d|month|custom&from&to` (KPIs + trend), `platform=all|facebook|instagram`, `top=week|month|all`, `sort=views|reach` (top videos). Custom ranges are validated (max 366 days) and fall back to 30 days.
- **Period semantics (decision):** a video counts in the period it was *published* (Asia/Manila days), using its latest lifetime metrics. Reason: `video_metrics_daily` snapshots only start at the first sync, so true in-period deltas aren't possible yet; this works from day one with the 90-day backfill and is easy to explain. % change compares with the previous period of equal length (shows "No earlier data" when the baseline is 0). The trend chart is "by day posted" for the same reason. Once snapshots accumulate, view-growth deltas can be added without schema changes.
- Weeks start Monday. "All time" = the 90 days that are synced. Total reach is a sum across videos (people can be counted twice) and is labelled so.
- Link clicks: Facebook per video; Instagram shows "—" per video, and the KPI card shows account-level Instagram profile link taps for the period, clearly labelled.
- "Why it worked" (expandable per row): hook (first non-empty caption line), length (FB only when Meta returns it), format (Reel / Facebook video post / Instagram feed video), posting day/time in Manila time.
- New view `videos_with_latest_metrics` (`security_invoker`, migration `20261021000300_...`). The page filters `profile_id = current user`, so an admin's personal dashboard shows only their own videos (admin-wide views come in Phase 5).
- Pure logic in `lib/dates.ts` and `lib/stats.ts`, covered by `npm test` (17 tests).
- Not yet seen with real data (no Supabase/Meta here); Phase 6 demo mode will let the UI be reviewed visually. Thumbnails are hotlinked Meta CDN URLs, which can expire; a placeholder box shows if missing, and a re-sync refreshes them.

## Phase 5 notes
- `/admin` (nav link shown to admins only): non-admins get a 404 from the page and the re-sync action also re-checks the role server-side; RLS already limits what a non-admin could read.
- Leaderboard: top 25 videos across all affiliates with the same platform / week-month-all / views-reach filters (reuses `TopVideos` with `basePath="/admin"` and an affiliate name per row).
- Affiliate table: connected accounts, sync status (up to date / not synced yet / needs reconnect / no accounts), 30-day views & reach (videos published in the last 30 Manila days, same rule as the affiliate dashboard), and a **Re-sync** button per affiliate that calls the sync function scoped to that `profile_id` (shared helper `lib/sync.ts`). "Last synced" shows the *oldest* active account so a stale one isn't masked.
- Migration `20261021000400_admin_support.sql`: `profiles.email` (backfilled; set by the sign-up trigger) and `profile_name` on `videos_with_latest_metrics`.
- Admin accounts themselves are excluded from the affiliate table (an admin who also posts videos sees their own on `/dashboard`).
- Reads page through PostgREST's 1000-row limit (`lib/supabase/fetch-all.ts`). Everything is aggregated in the app; if the affiliate count grows large, move the 30-day totals into a SQL view/RPC.
- Tests: `lib/admin.test.ts` (summary status, totals, ordering). Not yet exercised against a live database.

## Phase 6 notes
- `DEMO_MODE=true`: no login, no Supabase/Meta needed (verified by building and running with no Supabase env vars). `/login` redirects to `/dashboard`; the demo viewer is a fake creator ("Maria Santos") who is also an admin so `/admin` can be shown. A yellow banner shows on every page; "Sign out" is hidden.
- `lib/demo/data.ts`: deterministic (seeded PRNG), relative to the current date, no network (SVG data-URI thumbnails). 6 affiliates with FB + IG; one has an Instagram connection that `needs_reconnect`, one has never synced; IG videos always have 0 link clicks. Unit-tested (`lib/demo/data.test.ts`).
- `lib/data.ts` (`loadMyData`, `loadAdminData`) is the single data-access layer for both pages: demo data or Supabase. `lib/viewer.ts` (`getViewer`) is the single source for the signed-in user + role.
- Demo-mode no-ops: Connect redirects to the dashboard with a "demo" notice; `selectPage`, `disconnect`, "Sync now" and admin "Re-sync" never touch Supabase/Meta.
- Fixed while here: the personal dashboard's connections list was not filtered by owner, so an admin would have seen everyone's accounts under "Your accounts" (now `profile_id = viewer`).
- Visual check (headless Chromium, desktop + 390px mobile): no console errors; fixed clipped chart axis labels, overshooting chart curve, and a cramped mobile header.

## Phase 7 notes
- Public pages (no login): `/privacy`, `/data-deletion` (instructions), `/data-deletion/status?code=` and the Meta callback `POST /data-deletion/callback`.
- Callback: verifies Meta's `signed_request` (HMAC-SHA256 with `META_APP_SECRET`, constant-time compare; unit-tested incl. forged/tampered/wrong-algorithm cases), deletes all connections for that Meta user (Vault tokens first, then rows → cascades to videos and metrics), records a `deletion_requests` row (random 128-bit code, no personal data) and returns `{url, confirmation_code}`. The user's login/profile is kept (they may have other uses); they can remove it with in-app "Delete my data".
- To make that mapping possible, the connect flow now stores `connections.meta_user_id` (app-scoped Facebook user id; not readable by clients). Connections created before this migration have none and can't be matched by Meta's callback (none exist yet).
- In-app **Delete my data** (bottom of the dashboard, type `DELETE`): deletes tokens, connections, videos/metrics and the auth user, then signs out. No-op in demo mode.
- `docs/DEPLOY.md`: Supabase / Vercel / Meta app / App Review checklist incl. permission justifications and screencast outline.
- Contact email on the policy pages comes from `NEXT_PUBLIC_CONTACT_EMAIL`; set it before App Review. Privacy text is a plain-language draft and needs a legal read-through.
- **Not deployed**: publishing to Vercel needs your account/project and is outward-facing, so it's left for you to confirm.
