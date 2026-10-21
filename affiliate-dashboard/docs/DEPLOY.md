# Deploy & Meta App Review checklist

Owner: Zeek. Nothing here is automated; tick items off in order.

## 1. Supabase
- [ ] Create a project; enable the **Vault** extension (Database → Extensions).
- [ ] `supabase link --project-ref <ref>` then `supabase db push` (applies everything in `supabase/migrations/`).
- [ ] Auth → URL configuration: Site URL = your production URL; add redirect URLs `https://<domain>/auth/callback` and `http://localhost:3000/auth/callback`.
- [ ] Auth → Email: configure SMTP (the built-in sender is heavily rate-limited) and set the magic-link template.
- [ ] `supabase secrets set SYNC_SECRET=<random 32+ chars>` then `supabase functions deploy sync`.
- [ ] SQL editor, create the cron Vault secrets (see the comment in `20261021000200_sync_support.sql`): `sync_function_url` and `sync_secret` (same value as `SYNC_SECRET`).
- [ ] Promote yourself to admin: `update public.profiles set role='admin' where email='you@example.com';`

## 2. Vercel
- [ ] Import the repo, **Root Directory = `affiliate-dashboard`**.
- [ ] Environment variables (Production + Preview), names from `.env.example`:
  `NEXT_PUBLIC_SITE_URL` (https, no trailing slash), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `META_LOGIN_CONFIG_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] **Do not** set `DEMO_MODE=true` in Production (it disables login and shows fake data).
- [ ] After the first deploy open `/privacy` and `/data-deletion` in a private window; both must load without signing in.

## 3. Meta app (developers.facebook.com)
- [ ] App type **Business**; add **Facebook Login for Business**.
- [ ] Login configuration: type *User access token*, permissions `pages_show_list`, `pages_read_engagement`, `read_insights`, `instagram_basic`, `instagram_manage_insights`, `business_management`. Copy its ID into `META_LOGIN_CONFIG_ID`.
- [ ] Valid OAuth redirect URI: `https://<domain>/api/meta/callback`.
- [ ] App settings → Basic: **Privacy Policy URL** = `https://<domain>/privacy`; **User data deletion** → *Data deletion request URL* = `https://<domain>/data-deletion/callback` (the instructions page `https://<domain>/data-deletion` is the alternative); app icon, category, contact email.
- [ ] Before review, add yourself and testers under App roles and run the whole flow once with a Page that has a linked Instagram **Business/Creator** account.
- [ ] Test the deletion callback: App Dashboard → Facebook Login → Settings, or remove the app from a tester's Facebook *Business integrations* and check `/data-deletion/status?code=...` works.

## 4. App Review & Business Verification
- [ ] Complete **Business Verification** (legal documents for Z-Fast), required for advanced access to these permissions.
- [ ] Submit each permission with a short justification. Suggested wording:
  - `pages_show_list`: "Lists the Pages the creator manages so they can choose which one to connect."
  - `pages_read_engagement`: "Reads the creator's own Page posts and videos to show their performance."
  - `read_insights`: "Reads reach, views and link-click insights for the creator's own Page videos."
  - `instagram_basic`: "Identifies the Instagram professional account linked to the chosen Page and reads its media list."
  - `instagram_manage_insights`: "Reads views, reach and engagement for the creator's own Instagram videos and Reels."
  - `business_management`: "Needed to read Pages and Instagram accounts that are owned through a Business portfolio."
    (Request this one only if your test shows it is required; Meta rejects permissions it can't see being used.)
- [ ] Screencast (English, 1–3 min, per permission or one combined): sign in with the magic link → press **Connect Facebook & Instagram** → show the Facebook permission dialog → choose a Page → show the dashboard with KPIs, the top-videos table and "Why it worked" → show **Disconnect** and **Delete my data**. Record with a real test account (not demo mode).
- [ ] Provide test credentials / a tester account and step-by-step instructions in the submission notes.
- [ ] Privacy policy has been reviewed by someone qualified (the text in `app/privacy/page.tsx` is a plain-language starting point, not legal advice).

## 5. Go-live smoke test
- [ ] Sign up with a fresh email → connect → "Sync now" → data appears; the daily cron ran the next morning (check `select * from cron.job_run_details order by start_time desc limit 5;`).
- [ ] Sync function response shows no `warnings` about unsupported metrics (see the unverified-metrics note in `PROGRESS.md`).
