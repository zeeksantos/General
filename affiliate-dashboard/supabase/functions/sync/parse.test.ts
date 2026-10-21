import test from "node:test";
import assert from "node:assert/strict";
import {
  facebookMetrics, instagramMetrics, isRateLimitCode, isTokenCode,
  manilaDate, manilaDayRange, parseInsights, parseUsage,
} from "./parse.ts";

const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null });

test("manilaDate rolls over at 16:00 UTC", () => {
  assert.equal(manilaDate(new Date("2026-10-21T15:59:00Z")), "2026-10-21");
  assert.equal(manilaDate(new Date("2026-10-21T16:00:00Z")), "2026-10-22");
});

test("manilaDayRange spans exactly one Manila day", () => {
  const { since, until } = manilaDayRange("2026-10-22");
  assert.equal(new Date(since * 1000).toISOString(), "2026-10-21T16:00:00.000Z");
  assert.equal(until - since, 86400);
});

test("parseInsights handles values and total_value", () => {
  const out = parseInsights({
    data: [
      { name: "views", values: [{ value: 12 }] },
      { name: "profile_links_taps", total_value: { value: 3 } },
    ],
  });
  assert.deepEqual(out, { views: 12, profile_links_taps: 3 });
  assert.deepEqual(parseInsights(undefined), {});
});

test("instagramMetrics maps saved->saves and ms->seconds", () => {
  const m = instagramMetrics({ views: 100, reach: 80, saved: 5, likes: 9, ig_reels_avg_watch_time: 4500 });
  assert.equal(m.saves, 5);
  assert.equal(m.avg_watch_time, 4.5);
  assert.equal(m.link_clicks, 0);
  assert.equal(instagramMetrics({}).avg_watch_time, null);
});

test("facebookMetrics reads link clicks and merges counts", () => {
  const m = facebookMetrics(
    { post_media_view: 50, post_total_media_view_unique: 40, post_clicks_by_type: { "link clicks": 7, "other clicks": 2 } },
    { likes: 3, shares: 1 },
  );
  assert.equal(m.views, 50);
  assert.equal(m.reach, 40);
  assert.equal(m.link_clicks, 7);
  assert.equal(m.likes, 3);
  assert.equal(facebookMetrics({}).link_clicks, 0);
});

test("error code classification", () => {
  assert.ok(isRateLimitCode(4) && isRateLimitCode(80001) && !isRateLimitCode(190));
  assert.ok(isTokenCode(190) && isTokenCode(undefined, 401) && !isTokenCode(100, 400));
});

test("parseUsage takes the max across both headers", () => {
  const u = parseUsage(headers({
    "x-app-usage": '{"call_count":20,"total_time":35}',
    "x-business-use-case-usage": '{"123":[{"call_count":10,"total_cputime":82,"estimated_time_to_regain_access":5}]}',
  }));
  assert.equal(u.pct, 82);
  assert.equal(u.regainMinutes, 5);
  assert.deepEqual(parseUsage(headers({ "x-app-usage": "not json" })), { pct: 0, regainMinutes: 0 });
});
