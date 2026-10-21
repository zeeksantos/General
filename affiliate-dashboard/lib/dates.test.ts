import test from "node:test";
import assert from "node:assert/strict";
import { addDays, daysBetween, eachDay, inRange, manilaDate, monthStart, previousRange, resolveRange, weekStart } from "./dates.ts";

test("weekStart is Monday", () => {
  assert.equal(weekStart("2026-10-21"), "2026-10-19"); // Wednesday
  assert.equal(weekStart("2026-10-25"), "2026-10-19"); // Sunday belongs to the Monday before
  assert.equal(weekStart("2026-10-19"), "2026-10-19");
});

test("monthStart, addDays, daysBetween", () => {
  assert.equal(monthStart("2026-10-21"), "2026-10-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetween("2026-10-01", "2026-10-21"), 20);
});

test("resolveRange presets and custom validation", () => {
  assert.deepEqual(resolveRange("7d", "2026-10-21").range, { from: "2026-10-15", to: "2026-10-21" });
  assert.deepEqual(resolveRange("month", "2026-10-21").range, { from: "2026-10-01", to: "2026-10-21" });
  assert.deepEqual(resolveRange("custom", "2026-10-21", "2026-10-01", "2026-10-10"), { kind: "custom", range: { from: "2026-10-01", to: "2026-10-10" } });
  for (const [f, t] of [["2026-10-10", "2026-10-01"], ["nope", "2026-10-01"], ["2026-02-30", "2026-03-02"], ["2024-01-01", "2026-10-01"]]) {
    assert.equal(resolveRange("custom", "2026-10-21", f, t).kind, "30d");
  }
  assert.equal(resolveRange(undefined, "2026-10-21").kind, "30d");
});

test("previousRange has equal length and ends the day before", () => {
  assert.deepEqual(previousRange({ from: "2026-10-15", to: "2026-10-21" }), { from: "2026-10-08", to: "2026-10-14" });
});

test("inRange uses Manila day boundaries", () => {
  const r = { from: "2026-10-21", to: "2026-10-21" };
  assert.ok(inRange("2026-10-20T16:00:00Z", r));   // 00:00 Manila on the 21st
  assert.ok(!inRange("2026-10-20T15:59:59Z", r));
  assert.ok(inRange("2026-10-21T15:59:59Z", r));
  assert.ok(!inRange("2026-10-21T16:00:00Z", r));
  assert.equal(manilaDate(new Date("2026-10-21T16:00:00Z")), "2026-10-22");
});

test("eachDay is inclusive", () => {
  assert.deepEqual(eachDay({ from: "2026-10-30", to: "2026-11-01" }), ["2026-10-30", "2026-10-31", "2026-11-01"]);
});
