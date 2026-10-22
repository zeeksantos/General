import { UsersTable } from "@/components/admin/users-table";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadUsersData } from "@/lib/data";
import { inviteUsers, setSignupMode } from "./actions";

export const metadata = { title: "Admin · Users" };

const DONE: Record<string, string> = {
  approve: "Account approved.", suspend: "Account suspended.", reactivate: "Account reactivated.",
  make_admin: "Admin access granted.", remove_admin: "Admin access removed.", delete: "Account deleted.",
};

function Notices({ sp }: { sp: Record<string, string | undefined> }) {
  const msgs: { kind: "ok" | "err"; text: string }[] = [];
  if (sp.error) msgs.push({ kind: "err", text: sp.error.slice(0, 200) });
  if (sp.demo) msgs.push({ kind: "ok", text: "Demo mode: changes aren't saved." });
  if (sp.done) msgs.push({ kind: "ok", text: DONE[sp.done] ?? "Done." });
  if (sp.mail === "off") msgs.push({ kind: "ok", text: "They weren't emailed because email isn't set up yet (see docs/LAUNCH.md)." });
  if (sp.mail === "failed") msgs.push({ kind: "err", text: "The account is approved, but the notification email couldn't be sent." });
  if (sp.mode) msgs.push({ kind: "ok", text: sp.mode === "open" ? "Sign-up is now open: new accounts are active immediately." : "New accounts now need your approval." });
  if (sp.invited !== undefined) {
    const parts = [
      `${sp.invited} invited`, Number(sp.approved) ? `${sp.approved} existing account(s) approved` : "",
      Number(sp.existing) ? `${sp.existing} already active` : "", Number(sp.invalid) ? `${sp.invalid} invalid address(es) skipped` : "",
      sp.many ? "only the first 20 were used" : "",
    ].filter(Boolean);
    msgs.push({ kind: "ok", text: `${parts.join(", ")}.` });
    if (Number(sp.failed)) msgs.push({ kind: "err", text: `${sp.failed} invitation email(s) could not be sent. Those people can still sign up themselves with the invited address and will skip approval.` });
  }
  return <>{msgs.map((m, i) => <Notice key={i} kind={m.kind === "err" ? "error" : "success"}>{m.text}</Notice>)}</>;
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { users, signupMode, invites } = await loadUsersData();
  const pending = users.filter((u) => u.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <Notices sp={sp} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Who can sign up</CardTitle>
            <CardDescription>
              {signupMode === "approval"
                ? "New accounts wait for your approval before they can use the app. Invited emails skip the wait."
                : "Anyone who signs up gets in immediately."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setSignupMode} className="flex gap-2">
              <input type="hidden" name="mode" value={signupMode === "approval" ? "open" : "approval"} />
              <Button type="submit" variant="outline" size="sm">
                {signupMode === "approval" ? "Switch to open sign-up" : "Require approval for new accounts"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite people</CardTitle>
            <CardDescription>Paste up to 20 email addresses. They get an email link and skip approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={inviteUsers} className="flex flex-col gap-2">
              <label className="sr-only" htmlFor="emails">Email addresses</label>
              <textarea id="emails" name="emails" rows={3} required placeholder="name@example.com, another@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <Button type="submit" size="sm" className="self-start">Send invitations</Button>
            </form>
            {invites.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Invited, not signed up yet: {invites.map((i) => i.email).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="users-heading">
        <h2 id="users-heading" className="text-lg font-semibold">Users</h2>
        <UsersTable users={users} initialFilter={pending.length > 0 ? "pending" : "all"} />
        <p className="text-xs text-muted-foreground">
          Suspending blocks access immediately and stops syncing that user&apos;s accounts. Deleting removes their login, connected
          accounts, tokens and statistics permanently. You can&apos;t suspend or delete yourself or another admin, so there is always at least one admin.
        </p>
      </section>
    </div>
  );
}
