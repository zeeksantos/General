import test from "node:test";
import assert from "node:assert/strict";
import { demoData } from "./data.ts";
import { affiliateSummaries } from "../admin.ts";
import { kpiComparison } from "../stats.ts";

const now = new Date("2026-10-21T08:00:00Z");

test("demo data is deterministic", () => {
  assert.deepEqual(demoData(now), demoData(now));
});

test("demo data respects invariants", () => {
  const d = demoData(now);
  assert.equal(d.profiles.length, 6);
  assert.ok(d.videos.length > 100);
  for (const v of d.videos) {
    const age = (now.getTime() - new Date(v.published_at).getTime()) / 86_400_000;
    assert.ok(age >= 0 && age <= 90, `published within 90 days (${age})`);
    assert.ok(v.reach <= v.views);
    if (v.platform === "instagram") assert.equal(v.link_clicks, 0); // never per-video on IG
    assert.ok(v.thumbnail_url?.startsWith("data:image/svg+xml"), "no network thumbnails");
  }
  assert.ok(d.videos.every((v, i, a) => i === 0 || a[i - 1].published_at >= v.published_at));
});

test("demo covers the interesting states", () => {
  const d = demoData(now);
  const s = affiliateSummaries(d.profiles, d.connections, d.videos, { from: "2026-09-22", to: "2026-10-21" });
  const statuses = new Set(s.map((x) => x.status));
  assert.ok(statuses.has("ok") && statuses.has("needs_reconnect") && statuses.has("never_synced"));
  const mine = d.videos.filter((v) => v.profile_id === "demo-1");
  const { current } = kpiComparison(mine, { from: "2026-09-22", to: "2026-10-21" });
  assert.ok(current.views > 0);
});
