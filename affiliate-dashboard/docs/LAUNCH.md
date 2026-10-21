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
- [ ] **Do NOT turn on CAPTCHA protection yet.** Once it is on, Supabase rejects sign-up and sign-in requests that don't
      include a CAPTCHA token, and the forms don't send one yet. Ask for it to be added first (Cloudflare Turnstile is a good
      free choice) and then enable it.
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
