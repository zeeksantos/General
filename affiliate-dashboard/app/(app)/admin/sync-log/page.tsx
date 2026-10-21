import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { loadSyncLog } from "@/lib/data";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { groupWarnings, isProblem, summarizeRuns } from "@/lib/sync-log";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Sync log" };

const when = (iso: string) =>
  new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", error: "Error", needs_reconnect: "Needs reconnect", throttled: "Slowed down by Meta",
  partial: "Partly done", skipped_time_budget: "Skipped (out of time)",
};

export default async function SyncLogPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const runs = await loadSyncLog();
  const summary = summarizeRuns(runs);
  const warnings = groupWarnings(runs);
  const onlyProblems = filter === "problems";
  const shown = (onlyProblems ? runs.filter((r) => isProblem(r.status)) : runs).slice(0, 150);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Sync log</h1>
        <p className="text-sm text-muted-foreground">Every sync of every connected account from the last 7 days. Times are Philippine time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Last run", summary.lastRunAt ? when(summary.lastRunAt) : "No runs yet"],
          ["Runs (7 days)", formatNumber(summary.total)],
          ["Clean runs", formatNumber(summary.ok)],
          ["Needing a look", formatNumber(summary.problems)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={cn("text-lg font-semibold", label === "Needing a look" && summary.problems > 0 && "text-destructive")}>{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="warnings-heading">
        <h2 id="warnings-heading" className="text-lg font-semibold">Warnings by kind</h2>
        <p className="text-xs text-muted-foreground">
          If the same &ldquo;metric … unavailable&rdquo; warning appears for many videos, Meta has probably retired or renamed that
          metric. Tell the developer so it can be fixed. Numbers for that metric show as 0 until then.
        </p>
        {warnings.length === 0 ? (
          <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">No warnings. Every metric was read successfully.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border text-sm">
            {warnings.slice(0, 10).map((w) => (
              <li key={w.warning} className="flex items-start justify-between gap-4 p-3">
                <span className="break-words">{w.warning}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">×{w.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="runs-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="runs-heading" className="text-lg font-semibold">Runs</h2>
          <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
            <Link href="/admin/sync-log" className={cn("rounded px-3 py-1", !onlyProblems ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>All</Link>
            <Link href="/admin/sync-log?filter=problems" className={cn("rounded px-3 py-1", onlyProblems ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>Needing a look</Link>
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            {onlyProblems ? "No problems in the last 7 days." : "No syncs have run yet. They start once someone connects an account."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th><th className="p-3">Affiliate</th><th className="p-3">Account</th>
                  <th className="p-3">Result</th><th className="p-3 text-right">Videos</th><th className="p-3 text-right">Took</th><th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="p-3 whitespace-nowrap">
                      {when(r.started_at)}
                      <div className="text-xs text-muted-foreground">{r.source === "manual" ? "Sync now" : "Daily"}</div>
                    </td>
                    <td className="p-3">{r.profile_name ?? "—"}</td>
                    <td className="p-3">
                      {r.account_name ?? "—"}
                      {r.platform && <div className="text-xs text-muted-foreground">{r.platform === "instagram" ? "Instagram" : "Facebook"}</div>}
                    </td>
                    <td className={cn("p-3 font-medium", r.status === "ok" ? "text-emerald-600" : isProblem(r.status) ? "text-destructive" : "text-muted-foreground")}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </td>
                    <td className="p-3 text-right tabular-nums">{r.videos}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{r.duration_ms == null ? "—" : `${(r.duration_ms / 1000).toFixed(1)}s`}</td>
                    <td className="p-3">
                      {r.warnings.length === 0 ? "—" : (
                        <details className="text-xs">
                          <summary className="cursor-pointer">{r.warnings.length} {r.warnings.length === 1 ? "note" : "notes"}</summary>
                          <ul className="mt-1 list-disc pl-4">{r.warnings.map((w, i) => <li key={i} className="break-words">{w}</li>)}</ul>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
