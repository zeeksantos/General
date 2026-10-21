# Public launch checklist

What changed for public use: anyone can create an account at `/signup` (name, email, password, accepting the
Terms and Privacy Policy), sign in at `/login` with a password or an emailed link, reset a forgotten password at
`/forgot-password`, and manage their profile, password and data at `/settings`. Each sign-up gets a row in
`public.profiles` (role `affiliate`) created by a database trigger, and can only ever read their own data (row level
security). Admins are still promoted by hand.

## Supabase dashboard settings (cannot be changed from code)
- [ ] **Authentication → Providers → Email:** enabled; **Confirm email: ON** (stops fake sign-ups and makes sure the
      address is real). The sign-up form handles both settings.
- [ ] **Authentication → Sign In / Providers → password requirements:** set the minimum length to **10** to match the form
      (the form enforces it too, but the server setting is the real guard).
- [ ] **Authentication → URL Configuration:** Site URL = your production URL (custom domain once you have one). Redirect
      URLs: `<SITE>/auth/callback` (and `http://localhost:3000/auth/callback` for development).
- [ ] **Authentication → SMTP Settings:** configure your own SMTP provider (Resend, SendGrid, Amazon SES, etc.) with a
      sender on your domain. The built-in sender is limited to a handful of emails per hour and will break a real launch.
- [ ] **Authentication → Email Templates:** edit the "Confirm sign up", "Magic link" and "Reset password" texts so they
      mention Z-Fast and what the app is; keep the `{{ .ConfirmationURL }}` link.
- [ ] **Authentication → Rate Limits:** review the defaults for sign-ups, sign-ins and email sending.
- [ ] **CAPTCHA (Cloudflare Turnstile), in this order, because Supabase rejects sign-ups/sign-ins without a token once it is on:**
  1. Cloudflare dashboard → Turnstile → **Add widget** (free). Hostnames: your production domain (and `localhost` for local
     testing). Mode: Managed. Copy the **Site key** and the **Secret key**.
  2. Vercel → set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the site key (Production), then **redeploy** (it is baked in at build time).
     Open `/signup` and confirm the check appears and the button enables once it passes.
  3. **Only then** Supabase → Authentication → Attack Protection → enable **CAPTCHA protection**, provider **Turnstile**, paste
     the **Secret key**, save.
  4. Test sign-up, sign-in (password and email link) and forgot-password.
  - To switch it off: disable CAPTCHA in Supabase **first**, then remove the site key. Never the other way round.
  - Preview deployments get random hostnames; either add them to the widget or test CAPTCHA only on the production domain.
  - If the widget doesn't appear, an ad blocker or a Content-Security-Policy may be blocking `challenges.cloudflare.com`.
- [ ] **Authentication → Attack Protection:** leaked-password protection is on paid plans only.

## Plan limits to know about (Free plan)
- Free projects are **paused after about a week of no activity**. A public site with no traffic for a week would go down.
  Plan to move to a paid plan before a public launch, or keep the project active.
- Free plan limits on database size, monthly active users, and emails apply. Check the Supabase usage page regularly.

## Meta (Facebook / Instagram) gating
- Until **App Review** approves the permissions and the app is switched to **Live**, only people added as testers /
  developers can connect Facebook. New public users can sign up but will not be able to connect. The dashboard shows a notice
  about this while `NEXT_PUBLIC_META_APP_LIVE` is not `true`. Set it to `true` after the app is Live and redeploy.
- Facebook Login for Business only reaches users outside your business after Business Verification; see
  `BUSINESS_VERIFICATION.md`, `PERMISSIONS.md` and `SCREENCAST.md`.

## Legal
- [ ] Have the Terms (`/terms`) and Privacy Policy (`/privacy`) read by someone qualified. Both are plain-language drafts,
      not legal advice. The Terms name the Philippines as governing law; confirm that with your lawyer.
- [ ] If you will have users in the EU/UK or elsewhere with specific privacy laws (GDPR, etc.), the policy needs more detail.
- [ ] Set the business details env vars so the footer and policies show your real legal name, address and contact email.

## Smoke test after switching `DEMO_MODE` off
1. Open `/signup` in a private window, create an account, open the confirmation email link in the **same** browser.
2. You land on the dashboard. `/settings` shows your name and email; change the name and save.
3. Sign out, sign in with the password, then with the emailed link, then try "Forgot your password?".
4. Delete the test account from `/settings → Delete my data`.
5. In the Supabase dashboard check that `public.profiles` has your row (and that it is gone after step 4).

## Controlled sign-up, user management and alerts
- **Who can sign up** (Admin → Users): *approval required* (default) or *open*. In approval mode a new account can sign in but sees
  "waiting for approval" until an admin approves it; **invited emails skip approval**. Admins can also suspend, reactivate, make or
  remove admins, and delete users. You can't suspend/delete yourself or another admin, and there is always at least one admin.
  Suspension is enforced in the database (a suspended user's data queries return nothing) and their accounts stop syncing.
- **Needs in Vercel:** `SUPABASE_SERVICE_ROLE_KEY` (the Users page, invitations and approvals use it). Without it these pages error.
- **Invitations** use Supabase's own invite email, so they need the SMTP setup above to be reliable. If an invitation email fails,
  the person can still sign up with that address and will skip approval.
- **Sync log** (Admin → Sync log): every sync of every account for 7 days, with its result and warnings, plus "warnings by kind".
  After the first real syncs, check it: a metric warning on many videos means Meta changed that metric.
- **Alert emails** (optional): set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel (create a free Resend account, verify your sending
  domain). Then (a) approving a user emails them, (b) a user whose connection breaks gets a "please reconnect" email, and (c) admins
  get a daily summary of sync problems and accounts waiting for approval. The daily job runs at 03:30 Manila
  (`daily-notify`, calls `/api/notify`; the Vault secret `notify_url` points at the production URL, **update it if the domain
  changes**). Without Resend nothing is emailed; alerts wait up to 3 days and then expire. The sign-in/confirmation/invite emails
  are Supabase Auth emails and do not use Resend.
- The notify job can't reach the site while Vercel's login protection is on, or in demo mode. Turn protection off first.
