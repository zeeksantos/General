import Link from "next/link";

export const metadata = { title: "Privacy Policy" };
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const UPDATED = "October 21, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated {UPDATED}</p>
      <p>
        The Affiliate Dashboard (&ldquo;the app&rdquo;) is operated by Z-Fast Digital Marketing Agency (&ldquo;we&rdquo;).
        It lets affiliates and UGC creators see how their own videos perform on Facebook and Instagram. This policy
        explains what we collect, why, and how you can delete it.
      </p>

      <h2 className="mt-2 text-lg font-semibold">What we collect</h2>
      <ul className="list-disc pl-5">
        <li><strong>Account details:</strong> your email address and, if you give it, your name.</li>
        <li><strong>From Facebook and Instagram, only after you connect them:</strong> the ID and name of the Facebook Page and Instagram professional account you choose; your Facebook user ID (so we can honour deletion requests); and an access token for the Page.</li>
        <li><strong>Video data from those accounts:</strong> captions, links, thumbnails, publish dates and performance numbers (views, reach, likes, comments, shares, saves, link clicks, watch time) for videos from the last 90 days, refreshed daily.</li>
      </ul>
      <p>We do not collect anything from your personal profile, friends, messages or private content, and we never post on your behalf.</p>

      <h2 className="mt-2 text-lg font-semibold">How we use it</h2>
      <ul className="list-disc pl-5">
        <li>To show you your own videos and statistics.</li>
        <li>To let Z-Fast staff (administrators) see affiliates&apos; statistics so they can run the affiliate programme.</li>
        <li>To keep the service working, for example to tell you when a connection needs to be renewed.</li>
      </ul>
      <p>We do not sell your data, use it for advertising, or share it with anyone other than the service providers below.</p>

      <h2 className="mt-2 text-lg font-semibold">Who sees it</h2>
      <ul className="list-disc pl-5">
        <li><strong>You</strong> see only your own data.</li>
        <li><strong>Z-Fast administrators</strong> can see every affiliate&apos;s data.</li>
        <li><strong>Service providers</strong> that host the app: Supabase (database, sign-in, encrypted token storage) and Vercel (web hosting).</li>
      </ul>

      <h2 className="mt-2 text-lg font-semibold">Security</h2>
      <p>
        Access tokens are stored encrypted and are only used on our servers; they are never sent to your browser.
        Access to data is restricted by database-level rules so affiliates cannot read each other&apos;s data.
      </p>

      <h2 className="mt-2 text-lg font-semibold">How long we keep it</h2>
      <p>We keep your data while your account is active. We keep video statistics for videos from the last 90 days at the time of each sync. When you delete your data or disconnect an account, the related tokens and statistics are removed.</p>

      <h2 className="mt-2 text-lg font-semibold">Your choices and deleting your data</h2>
      <p>
        You can disconnect an account or delete all your data at any time, in the app or from Facebook&apos;s settings.
        Step-by-step instructions are on our <Link className="underline" href="/data-deletion">data deletion page</Link>.
      </p>

      <h2 className="mt-2 text-lg font-semibold">Children</h2>
      <p>The app is not intended for anyone under 18.</p>

      <h2 className="mt-2 text-lg font-semibold">Changes and contact</h2>
      <p>
        If we change this policy we will update the date above. Questions or requests:{" "}
        {CONTACT ? <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : "contact Z-Fast Digital Marketing Agency."}
      </p>
    </main>
  );
}
