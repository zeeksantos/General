import Link from "next/link";

export const metadata = { title: "Terms of Service" };
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const UPDATED = "October 22, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated {UPDATED}</p>
      <p>
        These terms apply when you use the Affiliate Dashboard (&ldquo;the service&rdquo;), operated by Z-Fast Digital Marketing
        Agency (&ldquo;we&rdquo;). By creating an account you agree to them and to our{" "}
        <Link className="underline" href="/privacy">Privacy Policy</Link>.
      </p>

      <h2 className="mt-2 text-lg font-semibold">The service</h2>
      <p>
        The service shows you statistics for videos on the Facebook Page and Instagram professional account you connect, so you can
        see which perform best. It only reads data; it never posts or changes anything on your accounts.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Your account</h2>
      <ul className="list-disc pl-5">
        <li>You must be at least 18 and give accurate information.</li>
        <li>Keep your password private. You are responsible for activity on your account. Tell us if you think it was accessed without permission.</li>
        <li>Only connect Pages and Instagram accounts that you own or are authorised to manage.</li>
      </ul>

      <h2 className="mt-2 text-lg font-semibold">Acceptable use</h2>
      <p>
        Don&apos;t misuse the service: no attempting to access other people&apos;s data, interfering with or overloading the service,
        reverse engineering it, or using it to break the law or Meta&apos;s terms and policies.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Your data</h2>
      <p>
        You keep ownership of your content and data. You allow us to access and process the data you connect only to provide the
        service, as described in the Privacy Policy. You can disconnect an account or delete all your data at any time in the app.
        Z-Fast administrators can see statistics of affiliates in the programme.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Third-party platforms</h2>
      <p>
        The service depends on Facebook and Instagram (Meta). Their data, limits and availability are outside our control and may
        change. Use of those platforms is governed by their own terms.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Availability and changes</h2>
      <p>
        We try to keep the service running but do not guarantee it will always be available or error-free. We may change or stop
        features, and we may suspend accounts that break these terms. You can stop using the service and delete your account at any time.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Disclaimers and liability</h2>
      <p>
        The service and its statistics are provided &ldquo;as is&rdquo;. Numbers come from Meta and may be delayed or incomplete.
        To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability is limited to
        the amount you paid us for the service in the previous 12 months (if any).
      </p>

      <h2 className="mt-2 text-lg font-semibold">Governing law and contact</h2>
      <p>
        These terms are governed by the laws of the Republic of the Philippines. We may update these terms and will change the date
        above when we do; continuing to use the service means you accept the update. Questions:{" "}
        {CONTACT ? <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : "contact Z-Fast Digital Marketing Agency."}
      </p>
    </main>
  );
}
