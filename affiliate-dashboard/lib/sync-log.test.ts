import test from "node:test";
import assert from "node:assert/strict";
import { adminDigestEmail, approvedEmail, reconnectEmail } from "./notify.ts";
import { groupWarnings, isProblem, normalizeWarning, summarizeRuns, type SyncRun } from "./sync-log.ts";

const run = (o: Partial<SyncRun>): SyncRun => ({
  id: "r", started_at: "2026-10-22T00:00:00Z", source: "cron", connection_id: "c", profile_id: "p", platform: "facebook",
  status: "ok", videos: 3, warnings: [], duration_ms: 1000, ...o,
});

test("problem statuses", () => {
  for (const s of ["error", "needs_reconnect", "throttled", "partial"]) assert.ok(isProblem(s), s);
  for (const s of ["ok", "skipped_time_budget"]) assert.ok(!isProblem(s), s);
});

test("summarizeRuns", () => {
  const s = summarizeRuns([run({}), run({ status: "error", started_at: "2026-10-22T05:00:00Z" }), run({ status: "partial" })]);
  assert.deepEqual(s, { total: 3, ok: 1, problems: 2, lastRunAt: "2026-10-22T05:00:00Z" });
  assert.equal(summarizeRuns([]).lastRunAt, null);
});

test("warnings are grouped by kind, most common first", () => {
  assert.equal(normalizeWarning("metric views unavailable for 17841400000000001/insights: nope"), "metric views unavailable for #/insights: nope");
  const g = groupWarnings([
    run({ warnings: ["metric views unavailable for 17841400000000001/insights: x", "metric reach unavailable for 17841400000000001/insights: y"] }),
    run({ warnings: ["metric views unavailable for 17841400000000002/insights: x"] }),
  ]);
  assert.deepEqual(g[0], { warning: "metric views unavailable for #/insights: x", count: 2 });
  assert.equal(g.length, 2);
});

test("emails", () => {
  const r = reconnectEmail([{ platform: "instagram", account_name: "@maria" }], "https://x.test");
  assert.match(r.text, /@maria \(Instagram\)/); assert.match(r.text, /https:\/\/x\.test\/dashboard/);
  assert.match(approvedEmail("Maria", "https://x.test").text, /Hi Maria/);
  assert.match(approvedEmail("", "https://x.test").text, /^Hi,/);
  assert.equal(adminDigestEmail({ runs: [run({})], pendingCount: 0 }, "https://x.test"), null); // nothing to report
  const d = adminDigestEmail({ runs: [run({ status: "error", profile_name: "Maria", account_name: "Page", warnings: ["boom"] })], pendingCount: 2 }, "https://x.test")!;
  assert.match(d.text, /2 accounts are waiting for approval/);
  assert.match(d.text, /Maria, Page \(facebook\): error — boom/);
});
