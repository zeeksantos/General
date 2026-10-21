# Affiliate Dashboard

Video performance dashboard for affiliates and UGC creators. Each creator connects their own Facebook Page and Instagram account and sees their top videos by platform, week and month.

- Requirements: [SPEC.md](SPEC.md)
- Instructions for Claude Code: [CLAUDE.md](CLAUDE.md)

## Try it without Meta or Supabase (demo mode)

```bash
cp .env.example .env.local   # leave the Supabase/Meta values empty
DEMO_MODE=true npm run dev   # then open http://localhost:3000
```

Demo mode serves seeded sample data (6 fake affiliates, 90 days of videos), skips login and shows a yellow banner. Connect, sync and disconnect are disabled. Never set `DEMO_MODE=true` on a deployment that should show real data.
