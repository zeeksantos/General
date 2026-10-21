# Deploy & Meta App Review checklist

Owner: Zeek. Nothing here is automated; tick items off in order.

## 1. Supabase
Project `affiliate-dashboard` (ref `kysbcszbkxzxzbqttvsn`, Free plan, ap-southeast-1) is created and **already has**: all migrations applied, the `sync` Edge Function deployed (JWT check off; it authenticates callers itself), the Vault secrets `sync_secret` + `sync_function_url`, and the daily pg_cron job. Nothing to redo unless you create a new project; in that case: link, `supabase db push`, `supabase functions deploy sync`, then create the two Vault secrets (`sync_secret` = a random string, `sync_function_url` = `https://<ref>.supabase.co/functions/v1/sync`) and set the same random string as `SYNC_SECRET` in Vercel.
- [ ] **Auth → URL configuration** (dashboard, cannot be scripted from here): Site URL = `https://affiliate-dashboard-xi.vercel.app` (or your custom domain); add redirect URLs `https://affiliate-dashboard-xi.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
- [ ] **Auth → Email**: the built-in sender allows only a few emails per hour; set up custom SMTP before inviting affiliates.
- [ ] **Free plan note:** Free projects are paused after ~1 week without activity. The daily sync keeps it active once accounts are connected; before that, open the dashboard now and then, or upgrade.
- [ ] Copy the **service_role / secret key** (Project Settings → API Keys) into Vercel as `SUPABASE_SERVICE_ROLE_KEY` (Production). It cannot be read by Claude's tooling and must never be committed.
- [ ] After your first sign-up, promote yourself: `update public.profiles set role='admin' where email='you@example.com';`

## 2. Vercel
- [ ] Import the repo, **Root Directory = `affiliate-dashboard`**.
- [ ] Environment variables (Production + Preview), names from `.env.example`:
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SYNC_SECRET` are **already set** (Production). Still to add: `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_ID`, `META_APP_SECRET`, `META_LOGIN_CONFIG_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_BUSINESS_LEGAL_NAME`, `NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_BUSINESS_PHONE` (footer details; they are baked in at build time, so redeploy after changing them).
- [ ] **Delete `DEMO_MODE`** from Production and Preview (currently `true` as a temporary measure: it disables login and shows fake data). Do this last, after the items above, then redeploy.
- [ ] Vercel Auth (deployment protection) is on; turn it off for Production (Settings → Deployment Protection) so Meta's reviewers can open `/privacy` and `/data-deletion`.
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
