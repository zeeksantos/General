import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { loadSyncLog } from "@/lib/data";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { groupWarnings, isProblem, summarizeRuns } from "@/lib/sync-log";
import { matchesQuery } from "@/lib/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Sync log" };

const when = (iso: string) =>
  new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", error: "Error", needs_reconnect: "Needs reconnect", throttled: "Slowed down by Meta",
  partial: "Partly done", skipped_time_budget: "Skipped (out of time)",
};

export default async function SyncLogPage({ searchParams }: { searchParams: Promise<{ filter?: string; status?: string; platform?: string; q?: string }> }) {
  const sp = await searchParams;
  const runs = await loadSyncLog();
  const summary = summarizeRuns(runs);
  const warnings = groupWarnings(runs);
  // `filter=problems` is the old link format; keep it working.
  const status = sp.status === "problems" || sp.status === "ok" ? sp.status : sp.filter === "problems" ? "problems" : "all";
  const platform = sp.platform === "facebook" || sp.platform === "instagram" ? sp.platform : "all";
  const q = (sp.q ?? "").slice(0, 80);
  const filtered = runs.filter(
    (r) =>
      (status === "all" || (status === "problems" ? isProblem(r.status) : r.status === "ok")) &&
      (platform === "all" || r.platform === platform) &&
      matchesQuery(q, r.profile_name, r.account_name),
  );
  const shown = filtered.slice(0, 150);
  const filtering = status !== "all" || platform !== "all" || q !== "";

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
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {shown.length}{filtered.length > shown.length ? ` of ${filtered.length}` : ""} runs
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Search</span>
            <input type="search" name="q" defaultValue={q} placeholder="Affiliate or account" className="h-9 w-56 rounded-md border border-border bg-background px-3" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Result</span>
            <select name="status" defaultValue={status} className="h-9 rounded-md border border-border bg-background px-2">
              <option value="all">All</option><option value="problems">Needing a look</option><option value="ok">Clean runs</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Platform</span>
            <select name="platform" defaultValue={platform} className="h-9 rounded-md border border-border bg-background px-2">
              <option value="all">Both</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option>
            </select>
          </label>
          <button type="submit" className="h-9 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90">Apply</button>
          {filtering && <Link href="/admin/sync-log" className="h-9 self-end py-2 text-sm underline">Clear filters</Link>}
        </form>
        {shown.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {filtering ? "No runs match these filters." : "No syncs have run yet. They start once someone connects an account."}
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
