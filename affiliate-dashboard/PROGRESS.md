# Progress

- [x] **1. Scaffold Next.js + Supabase, auth, schema + RLS**
- [x] **2.** Meta connect flow + encrypted token storage
- [ ] 3. Sync Edge Function + cron + 90-day backfill
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
