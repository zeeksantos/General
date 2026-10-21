import test from "node:test";
import assert from "node:assert/strict";
import { affiliateSummaries, type ConnectionSummaryRow, type ProfileRow } from "./admin.ts";
import type { VideoStat } from "./stats.ts";

const p = (id: string, name = id): ProfileRow => ({ id, name, email: `${id}@x.test` });
const c = (profile_id: string, o: Partial<ConnectionSummaryRow> = {}): ConnectionSummaryRow => ({
  profile_id, platform: "facebook", account_name: "Page", status: "active", last_synced_at: "2026-10-21T00:00:00Z", ...o,
});
const v = (profile_id: string, views: number, published_at = "2026-10-20T04:00:00Z") =>
  ({ profile_id, id: "v", platform: "facebook", caption: null, permalink: null, thumbnail_url: null, media_type: "video",
     published_at, duration_seconds: null, account_name: "a", views, reach: views / 2, link_clicks: 0, likes: 0, comments: 0,
     shares: 0, saves: 0, avg_watch_time: null }) as VideoStat & { profile_id: string };

const range = { from: "2026-09-22", to: "2026-10-21" };

test("summaries compute status, totals and sort by views", () => {
  const out = affiliateSummaries(
    [p("a"), p("b"), p("c"), p("d"), p("e")],
    [
      c("a"),
      c("b", { status: "needs_reconnect" }),
      c("c", { last_synced_at: null }),
      c("d", { last_synced_at: "2026-10-19T00:00:00Z" }), c("d", { platform: "instagram", last_synced_at: "2026-10-21T00:00:00Z" }),
    ],
    [v("a", 100), v("a", 50), v("b", 500), v("a", 999, "2026-01-01T00:00:00Z") /* outside 30d */],
    range,
  );
  const by = Object.fromEntries(out.map((s) => [s.profile.id, s]));
  assert.deepEqual(out.map((s) => s.profile.id)[0], "b");
  assert.equal(by.a.views, 150);
  assert.equal(by.a.reach, 75);
  assert.equal(by.a.status, "ok");
  assert.equal(by.b.status, "needs_reconnect");
  assert.equal(by.c.status, "never_synced");
  assert.equal(by.c.lastSyncedAt, null);
  assert.equal(by.d.lastSyncedAt, "2026-10-19T00:00:00Z"); // oldest wins
  assert.equal(by.e.status, "no_accounts");
});
