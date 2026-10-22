import test from "node:test";
import assert from "node:assert/strict";
import { matchesQuery, nextSort, sortBy } from "./table.ts";

test("matchesQuery: all words, any field, case-insensitive", () => {
  assert.ok(matchesQuery("", "anything"));
  assert.ok(matchesQuery("maria santos", "Maria Santos", "maria@x.com"));
  assert.ok(matchesQuery("maria x.com", "Maria Santos", "maria@x.com")); // words may match different fields
  assert.ok(!matchesQuery("maria jun", "Maria Santos", "maria@x.com"));
  assert.ok(matchesQuery("MARIA", null, "maria@x.com"));
  assert.ok(!matchesQuery("zzz", undefined, null));
});

test("sortBy: numbers, strings, nulls last, stable", () => {
  const rows = [{ n: "b", v: 2 }, { n: "a", v: 10 }, { n: "c", v: null }, { n: "d", v: 2 }];
  assert.deepEqual(sortBy(rows, (r) => r.v, "asc").map((r) => r.n), ["b", "d", "a", "c"]);  // stable among equals; null last
  assert.deepEqual(sortBy(rows, (r) => r.v, "desc").map((r) => r.n), ["a", "b", "d", "c"]); // null still last
  assert.deepEqual(sortBy(rows, (r) => r.n, "desc").map((r) => r.n), ["d", "c", "b", "a"]);
  assert.deepEqual(sortBy([{ n: "b" }, { n: "A" }, { n: "c" }], (r) => r.n, "asc").map((r) => r.n), ["A", "b", "c"]); // case-insensitive
  const input = [{ v: 2 }, { v: 1 }]; sortBy(input, (r) => r.v, "asc");
  assert.deepEqual(input, [{ v: 2 }, { v: 1 }]); // input not mutated
});

test("nextSort", () => {
  assert.deepEqual(nextSort({ key: "name", dir: "asc" }, "name"), { key: "name", dir: "desc" });
  assert.deepEqual(nextSort({ key: "name", dir: "desc" }, "name"), { key: "name", dir: "asc" });
  assert.deepEqual(nextSort({ key: "name", dir: "asc" }, "views", "desc"), { key: "views", dir: "desc" });
});
