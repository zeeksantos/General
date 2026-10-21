# Progress

- [x] **1. Scaffold Next.js + Supabase, auth, schema + RLS**
- [x] **2.** Meta connect flow + encrypted token storage
- [x] **3.** Sync Edge Function + cron + 90-day backfill
- [ ] 4. Affiliate dashboard (KPIs, trends, top videos with platform/week/month filters)
- [ ] 5. Admin view + leaderboard
- [ ] 6. Demo mode with seeded fake data
- [ ] 7. Privacy policy + data deletion callback pages, deploy to Vercel

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
