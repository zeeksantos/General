# Meta Business Verification checklist

Goal: verify **Z-Fast Digital Marketing Agency** in Meta Business Suite so the app can get **Advanced Access** to the
permissions it requests (App Review needs this because the app reads data of people outside your own business).

> Written from general knowledge of the process. Meta changes its screens, accepted documents and wording often, and
> I could not open Meta's pages while writing this. Where Meta's own screen disagrees, follow Meta's screen.

## 0. Decide these first (they cause most rejections)
- [ ] **Legal business name**, exactly as on your registration documents (not a brand or trading name).
- [ ] **A domain you own** for the app, e.g. `affiliates.<yourdomain>`. You can't prove ownership of `*.vercel.app`
      (you can't edit its DNS), and Meta's domain check needs DNS or file access. Buy/choose the domain, add it in Vercel
      (Settings → Domains), then update the Supabase Auth URLs, `NEXT_PUBLIC_SITE_URL`, the Meta redirect URI,
      privacy and deletion URLs to use it.
- [ ] **A business email on that domain** (e.g. `hello@<yourdomain>`) and a business phone number that can receive a call or SMS.
- [ ] **Who is the admin:** the person doing this should be an admin of the Business portfolio, and the legal name
      and address they enter must match the documents.

## 1. Prepare the documents
Meta asks for documents that prove your **legal name** and **address**, and often your **phone/website**. Gather clear,
unedited scans or photos (all four corners visible, readable, in colour). For a business in the Philippines, commonly
accepted examples are (confirm in Meta's list for your country):

| Proves | Examples |
|---|---|
| Legal name and registration | SEC Certificate of Registration + Articles of Incorporation (corporation/partnership) or DTI Certificate of Business Name Registration (sole proprietor) |
| Business is active / tax-registered | BIR Certificate of Registration (Form 2303), current Mayor's/Business Permit |
| Address | Business permit showing the address, or a recent utility bill, bank statement or lease in the business's name (usually dated within the last few months) |
| Phone number | Utility/telecom bill listing the business name and number (only if requested) |

- [ ] Name on every document matches the legal name you will type.
- [ ] Address on the documents matches the address you will type (same spelling, unit and barangay).
- [ ] Files are in an accepted format (typically PDF/JPG/PNG) and under the size limit shown in the upload box.

## 2. Make the website match
Meta may check that the website shows the business is real.
- [ ] The site loads publicly (Vercel deployment protection off) over HTTPS on **your own domain**.
- [ ] Show the **legal business name**, a contact email and address/phone somewhere public. The privacy page already
      names Z-Fast and shows the contact email once `NEXT_PUBLIC_CONTACT_EMAIL` is set; the site footer
      shows them on every page. Set `NEXT_PUBLIC_BUSINESS_LEGAL_NAME`, `NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_BUSINESS_PHONE`
      and `NEXT_PUBLIC_CONTACT_EMAIL` in Vercel to match your documents exactly, then redeploy.
- [ ] `/privacy` and `/data-deletion` open without signing in.
- [ ] The business email domain matches the website domain where possible.

## 3. Set up the Business portfolio
- [ ] Go to business.facebook.com and open (or create) the **Business portfolio** for Z-Fast.
- [ ] **Business settings → Business info:** enter the legal name, address, phone, website exactly as in step 0 and 1.
- [ ] Turn on **two-factor authentication** for admins (Security Center asks for this).
- [ ] Add the Facebook Page(s) and the Meta **app** to the portfolio (Business settings → Accounts → Apps → Add) so the app
      belongs to the business that gets verified.

## 4. Start the verification
- [ ] **Business settings → Security Center → Business verification → Start verification** (menu names may differ).
- [ ] Confirm the legal name, address, phone and website.
- [ ] Choose how to verify the **business contact**: phone call/SMS to the number you entered, or email on your domain.
- [ ] **Verify the domain** when asked (Business settings → Brand safety → Domains → Add): add the DNS **TXT** record Meta
      gives you at your DNS host (or the meta-tag/HTML-file option if offered), wait for propagation, then press Verify.
- [ ] Upload the documents from step 1 for legal name and address.
- [ ] Submit, then watch the email and the Security Center for status or requests for more information.

## 5. While you wait
- [ ] Don't change the business name, address or domain during review. A mismatch restarts the process.
- [ ] Reply quickly if Meta asks for a clearer document or a different type.
- [ ] Meanwhile, finish building and testing in Development mode (testers only) and record the screencast.
      Timing varies; allow from a few days to a few weeks.

## 6. If you're rejected
Common reasons and fixes:
- **Name or address doesn't match the documents:** correct the details to match the documents exactly, or supply a document with that name/address.
- **Unclear or edited document:** re-scan in colour, full page, no cropping or filters.
- **Website doesn't show the business:** add the legal name and contact details; make sure it's public, on your own domain.
- **Domain unverified:** re-check the TXT record at the DNS provider (no typos, no proxy rewriting) and retry.
- **Expired documents:** use a current business permit or recent bill.
- Appeal or resubmit from the Security Center with corrected details.

## 7. After approval
- [ ] Confirm the portfolio shows **Verified**.
- [ ] Meta may also ask for **Access Verification** (or a "Tech Provider" check) because the app serves people outside
      your business. Follow the prompt if it appears. I couldn't confirm whether it applies to this app.
- [ ] Submit **App Review** for each permission using `PERMISSIONS.md` and the recording from `SCREENCAST.md`.
- [ ] After the permissions are approved, switch the app from **Development** to **Live**.
- [ ] Remove `business_management` from the login configuration and the request if you couldn't show it in use.

## What I can do for you
- Update every URL in the code, docs and Supabase/Vercel settings when you move to a custom domain.
