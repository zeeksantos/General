import test from "node:test";
import assert from "node:assert/strict";
import { timeAgo } from "./format.ts";

test("timeAgo", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  assert.equal(timeAgo(ago(20_000), now), "just now");
  assert.equal(timeAgo(ago(5 * 60_000), now), "5 min ago");
  assert.equal(timeAgo(ago(3 * 3_600_000), now), "3 h ago");
  assert.equal(timeAgo(ago(24 * 3_600_000), now), "1 day ago");
  assert.equal(timeAgo(ago(49 * 3_600_000), now), "2 days ago");
  assert.equal(timeAgo(ago(-60_000), now), "just now"); // clock skew never shows "in the future"
});
