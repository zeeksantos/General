import Link from "next/link";

export const metadata = { title: "Data deletion instructions" };
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function DataDeletionPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">How to delete your data</h1>
      <p>
        You can remove the data the Affiliate Dashboard (run by Z-Fast Digital Marketing Agency) holds about you at any
        time. There are three ways to do it.
      </p>

      <h2 className="mt-2 text-lg font-semibold">1. Inside the app (fastest)</h2>
      <ol className="list-decimal pl-5">
        <li><Link className="underline" href="/login">Sign in</Link> to the dashboard.</li>
        <li>Scroll to <strong>Delete my data</strong> at the bottom of your dashboard.</li>
        <li>Type <code>DELETE</code> and confirm. We delete your connected accounts, access tokens, video statistics and your account.</li>
      </ol>
      <p>To remove only one Facebook Page or Instagram account, press <strong>Disconnect</strong> next to it instead.</p>

      <h2 className="mt-2 text-lg font-semibold">2. From Facebook</h2>
      <ol className="list-decimal pl-5">
        <li>Open Facebook <strong>Settings &amp; privacy → Settings → Business integrations</strong>.</li>
        <li>Find this app, choose <strong>Remove</strong>, and tick the option to delete the data it received.</li>
      </ol>
      <p>
        Facebook then notifies us automatically. We delete your connected accounts, tokens and statistics and give you a
        confirmation code and a link where you can check the status.
      </p>

      <h2 className="mt-2 text-lg font-semibold">3. Ask us</h2>
      <p>
        {CONTACT ? <>Email <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you signed up with. </> : "Contact Z-Fast Digital Marketing Agency from the email address you signed up with. "}
        We will confirm the deletion within 30 days.
      </p>

      <p className="text-muted-foreground">
        Deleting your data does not affect your Facebook or Instagram accounts or the posts on them. See our{" "}
        <Link className="underline" href="/privacy">Privacy Policy</Link> for what we store.
      </p>
    </main>
  );
}
