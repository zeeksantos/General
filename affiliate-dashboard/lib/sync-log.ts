export type SyncRun = {
  id: string;
  started_at: string;
  source: "cron" | "manual";
  connection_id: string | null;
  profile_id: string | null;
  platform: "facebook" | "instagram" | null;
  status: string;
  videos: number;
  warnings: string[];
  duration_ms: number | null;
  // joined for display
  profile_name?: string;
  account_name?: string;
};

/** Anything other than a clean run needs a look. */
export const PROBLEM_STATUSES = ["error", "needs_reconnect", "throttled", "partial"];
export const isProblem = (status: string) => PROBLEM_STATUSES.includes(status);

export function summarizeRuns(runs: SyncRun[]) {
  const problems = runs.filter((r) => isProblem(r.status)).length;
  const last = runs.reduce<string | null>((m, r) => (m === null || r.started_at > m ? r.started_at : m), null);
  return { total: runs.length, ok: runs.filter((r) => r.status === "ok").length, problems, lastRunAt: last };
}

/** Collapses ids and numbers so the same kind of warning is counted once ("metric views unavailable ..."). */
export function normalizeWarning(w: string): string {
  return w.replace(/\b\d{6,}\b/g, "#").replace(/\s+/g, " ").trim().slice(0, 160);
}

/** Warnings across runs, most frequent first. This is where retired/unsupported Meta metrics show up. */
export function groupWarnings(runs: SyncRun[]): { warning: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of runs) for (const w of r.warnings ?? []) {
    const k = normalizeWarning(String(w));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([warning, count]) => ({ warning, count })).sort((a, b) => b.count - a.count || a.warning.localeCompare(b.warning));
}
