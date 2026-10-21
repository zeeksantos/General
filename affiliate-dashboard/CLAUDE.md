# CLAUDE.md

Instructions for Claude Code working in this repo.

## Project
Affiliate / UGC video performance dashboard for Z-Fast Digital Marketing Agency. Each affiliate connects their own Facebook Page + Instagram professional account and sees which videos perform best. Full requirements live in `SPEC.md` — read it before starting any task.

## How to work
- Build in the phase order from `SPEC.md` section 9. Finish and verify one phase before starting the next.
- At the start of each phase, state the plan briefly; at the end, summarize what was built and what's left.
- Keep a running checklist of phases in `PROGRESS.md` and update it as phases complete.
- Commit after each phase with a clear message.

## Stack conventions
- Next.js App Router + TypeScript (strict), Tailwind, shadcn/ui, Recharts.
- Supabase for auth, Postgres, RLS, Edge Functions, Cron. All schema changes go through migrations in `supabase/migrations/`.
- Deploy target: Vercel.
- Meta Graph API version lives in ONE constant (e.g. `lib/meta/config.ts`). Never hardcode the version elsewhere.

## Meta API rules
- Before using any insights metric, verify it exists for the pinned Graph API version. Meta has deprecated impressions/plays/reach-style metrics through 2025–2026; current replacements are listed in `SPEC.md` section 5.
- Never log or return access tokens to the client. Store them encrypted (Supabase Vault/pgsodium) and only decrypt server-side.
- Handle token errors by marking the connection `needs_reconnect`, not by crashing the sync.

## Security
- RLS on every table. Affiliates only see their own rows; admins see all.
- Secrets only in env vars (`.env.local`, Vercel env, Supabase secrets). Never commit them. Keep `.env.example` up to date with variable names only.

## Demo mode
- A `DEMO_MODE=true` env flag serves seeded fake data so the UI works before Meta App Review is approved.

## Language & audience
- UI copy in English, simple and clear — users are affiliates and UGC creators, not marketers.
- Currency/locale defaults: Philippines (PHP, Asia/Manila timezone) for dates and week/month boundaries.
