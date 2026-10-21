import Link from "next/link";

// Business details shown on every page. Set these to match your registration documents exactly
// (Meta Business Verification compares the public website with them). Only fields that are set are shown.
const LEGAL_NAME = process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME || "Z-Fast Digital Marketing Agency";
const ADDRESS = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS;
const PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE;
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-6 text-xs text-muted-foreground sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:justify-between">
        <address className="flex flex-col gap-0.5 not-italic">
          <span className="font-medium text-foreground">{LEGAL_NAME}</span>
          {ADDRESS && <span>{ADDRESS}</span>}
          {PHONE && <span>Phone: <a className="underline" href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}>{PHONE}</a></span>}
          {EMAIL && <span>Email: <a className="underline" href={`mailto:${EMAIL}`}>{EMAIL}</a></span>}
        </address>
        <nav aria-label="Legal" className="flex gap-4 sm:items-start">
          <Link className="underline" href="/terms">Terms</Link>
          <Link className="underline" href="/privacy">Privacy Policy</Link>
          <Link className="underline" href="/data-deletion">Data deletion</Link>
        </nav>
      </div>
      <p className="mx-auto mt-3 max-w-6xl">
        Affiliate Dashboard is operated by {LEGAL_NAME}. It is not affiliated with or endorsed by Meta.
      </p>
    </footer>
  );
}
