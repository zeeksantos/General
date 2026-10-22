import { Button } from "@/components/ui/button";
import { disconnect } from "@/app/(app)/connect/pick/actions";
import { syncNow } from "@/app/(app)/dashboard/actions";
import type { ConnectionRow } from "@/components/connections-card";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLATFORM = { facebook: "Facebook", instagram: "Instagram" } as const;
// Until Meta approves the app (App Review), only people added as testers can connect an account.
const META_APP_LIVE = process.env.NEXT_PUBLIC_META_APP_LIVE === "true";

/** One slim row for the connected accounts, so the numbers stay at the top of the page. */
export function AccountsBar({ connections }: { connections: ConnectionRow[] }) {
  const now = new Date();
  return (
    <section aria-label="Connected accounts" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
        {connections.map((c) => {
          const broken = c.status === "needs_reconnect";
          return (
            <li key={c.id} className="flex min-w-0 items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", broken ? "bg-destructive" : c.last_synced_at ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
              <span className="truncate font-medium">{c.account_name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {PLATFORM[c.platform]} · {broken ? "needs reconnecting" : c.last_synced_at ? `synced ${timeAgo(c.last_synced_at, now)}` : "not synced yet"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2">
        <form action={syncNow}><Button type="submit" size="sm" variant="outline">Sync now</Button></form>
        <details className="relative">
          <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
            Manage
          </summary>
          <div className="absolute right-0 z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
            {connections.map((c) => (
              <form key={c.id} action={disconnect} className="flex items-center justify-between gap-2 text-sm">
                <input type="hidden" name="connection_id" value={c.id} />
                <span className="min-w-0 truncate">{c.account_name} <span className="text-xs text-muted-foreground">({PLATFORM[c.platform]})</span></span>
                <Button type="submit" size="sm" variant="outline">Disconnect</Button>
              </form>
            ))}
            {!META_APP_LIVE && (
              <p className="text-xs text-muted-foreground">
                Facebook is still reviewing our app, so only invited testers can connect a new Page for now.
              </p>
            )}
            <Button asChild size="sm" className="self-start">
              {/* Plain anchor: this starts an external OAuth redirect, not a client navigation. */}
              <a href="/api/meta/connect">Reconnect or add another Page</a>
            </Button>
          </div>
        </details>
      </div>
    </section>
  );
}
