# Progress

- [x] **1. Scaffold Next.js + Supabase, auth, schema + RLS**
- [ ] 2. Meta connect flow + encrypted token storage
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
