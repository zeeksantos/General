import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserAction, UserRow } from "@/lib/admin-users";
import { loadUsersData } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inviteUsers, setSignupMode, userAction } from "./actions";

export const metadata = { title: "Admin · Users" };

const DONE: Record<string, string> = {
  approve: "Account approved.", suspend: "Account suspended.", reactivate: "Account reactivated.",
  make_admin: "Admin access granted.", remove_admin: "Admin access removed.", delete: "Account deleted.",
};
const STATUS_STYLE = { pending: "text-amber-600", active: "text-emerald-600", suspended: "text-destructive" } as const;

function ActionButton({ user, action, label, danger, confirm }: { user: UserRow; action: UserAction; label: string; danger?: boolean; confirm?: string }) {
  const variant = danger ? "destructive" : "outline";
  return (
    <form action={userAction}>
      <input type="hidden" name="user_id" value={user.id} />
      <input type="hidden" name="action" value={action} />
      {confirm
        ? <ConfirmButton message={confirm} size="sm" variant={variant}>{label}</ConfirmButton>
        : <Button type="submit" size="sm" variant={variant}>{label}</Button>}
    </form>
  );
}

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
  return <>{msgs.map((m, i) => (
    <p key={i} role={m.kind === "err" ? "alert" : "status"} className={cn("rounded-md border p-3 text-sm", m.kind === "err" ? "border-destructive text-destructive" : "border-border")}>{m.text}</p>
  ))}</>;
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { users, signupMode, invites } = await loadUsersData();
  const pending = users.filter((u) => u.status === "pending");
  const filter = sp.filter === "all" ? "all" : sp.filter === "pending" || pending.length > 0 ? "pending" : "all";
  const shown = filter === "pending" ? pending : users;
  const activeAdmins = users.filter((u) => u.role === "admin" && u.status === "active").length;

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="users-heading" className="text-lg font-semibold">Users</h2>
          <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
            <Link href="/admin/users?filter=pending" className={cn("rounded px-3 py-1", filter === "pending" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              Waiting for approval ({pending.length})
            </Link>
            <Link href="/admin/users?filter=all" className={cn("rounded px-3 py-1", filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              All users ({users.length})
            </Link>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            {filter === "pending" ? "Nobody is waiting for approval." : "No users yet."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">User</th><th className="p-3">Status</th><th className="p-3">Role</th>
                  <th className="p-3">Joined</th><th className="p-3 text-right">Accounts</th><th className="p-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <div className="font-medium">{u.name || u.email || "Unknown"}</div>
                      {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
                    </td>
                    <td className={cn("p-3 font-medium capitalize", STATUS_STYLE[u.status])}>{u.status}</td>
                    <td className="p-3">{u.role === "admin" ? "Admin" : "Affiliate"}</td>
                    <td className="p-3 whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="p-3 text-right tabular-nums">{u.accounts}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {u.status === "pending" && <ActionButton user={u} action="approve" label="Approve" />}
                        {u.status === "suspended" && <ActionButton user={u} action="reactivate" label="Reactivate" />}
                        {u.status === "active" && u.role === "affiliate" && <ActionButton user={u} action="suspend" label="Suspend" confirm={`Suspend ${u.name || u.email}? They lose access immediately.`} />}
                        {u.status === "active" && u.role === "affiliate" && <ActionButton user={u} action="make_admin" label="Make admin" />}
                        {u.role === "admin" && activeAdmins > 1 && <ActionButton user={u} action="remove_admin" label="Remove admin" />}
                        {u.role === "affiliate" && <ActionButton user={u} action="delete" label="Delete" danger confirm={`Permanently delete ${u.name || u.email}, their connected accounts and all their statistics? This cannot be undone.`} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Suspending blocks access immediately and stops syncing that user&apos;s accounts. Deleting removes their login, connected
          accounts, tokens and statistics permanently. You can&apos;t suspend or delete yourself or another admin, so there is always at least one admin.
        </p>
      </section>
    </div>
  );
}
