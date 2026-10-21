import test from "node:test";
import assert from "node:assert/strict";
import { kpiComparison, pctChange, topVideos, trend, whyItWorked, type VideoStat } from "./stats.ts";

const v = (o: Partial<VideoStat>): VideoStat => ({
  id: "x", platform: "facebook", caption: null, permalink: null, thumbnail_url: null, media_type: "video",
  published_at: "2026-10-20T04:00:00Z", duration_seconds: null, account_name: "a",
  views: 0, reach: 0, link_clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0, avg_watch_time: null, ...o,
});

const today = "2026-10-21"; // Wednesday

test("kpiComparison compares against the previous equal period", () => {
  const videos = [
    v({ id: "a", views: 100, reach: 50, link_clicks: 4, published_at: "2026-10-20T04:00:00Z" }),
    v({ id: "b", views: 40, reach: 20, published_at: "2026-10-13T04:00:00Z" }), // previous 7d
  ];
  const r = kpiComparison(videos, { from: "2026-10-15", to: "2026-10-21" });
  assert.deepEqual(r.current, { views: 100, reach: 50, link_clicks: 4 });
  assert.equal(r.previous.views, 40);
  assert.equal(r.change.views, 150);
  assert.equal(r.change.link_clicks, null); // no baseline
  assert.equal(pctChange(5, 0), null);
});

test("trend buckets by Manila publish day and platform", () => {
  const t = trend(
    [v({ platform: "instagram", views: 7, reach: 3, published_at: "2026-10-20T17:00:00Z" })], // 21 Oct 01:00 Manila
    { from: "2026-10-20", to: "2026-10-21" },
  );
  assert.equal(t[0].instagram_views, 0);
  assert.equal(t[1].instagram_views, 7);
  assert.equal(t[1].instagram_reach, 3);
});

test("topVideos filters by platform and window, sorts by key", () => {
  const videos = [
    v({ id: "fb-old", views: 999, published_at: "2026-09-01T00:00:00Z" }),
    v({ id: "fb-new", views: 10, reach: 90 }),
    v({ id: "ig-new", platform: "instagram", views: 50, reach: 20 }),
  ];
  const ids = (o: Parameters<typeof topVideos>[1]) => topVideos(videos, o).map((x) => x.id);
  assert.deepEqual(ids({ platform: "all", window: "all", sort: "views", today }), ["fb-old", "ig-new", "fb-new"]);
  assert.deepEqual(ids({ platform: "all", window: "week", sort: "views", today }), ["ig-new", "fb-new"]);
  assert.deepEqual(ids({ platform: "all", window: "month", sort: "reach", today }), ["fb-new", "ig-new"]);
  assert.deepEqual(ids({ platform: "instagram", window: "all", sort: "views", today }), ["ig-new"]);
});

test("whyItWorked", () => {
  const w = whyItWorked(v({ caption: "\n  Stop scrolling!\nmore text", media_type: "reel", platform: "instagram", duration_seconds: 75, published_at: "2026-10-20T12:30:00Z" }));
  assert.equal(w.hook, "Stop scrolling!");
  assert.equal(w.length, "1 min 15 sec");
  assert.equal(w.format, "Reel");
  assert.match(w.posted, /Tuesday/); // 20:30 Manila
  assert.equal(whyItWorked(v({})).hook, "No caption");
  assert.equal(whyItWorked(v({})).length, "Not available");
});
