import test from "node:test";
import assert from "node:assert/strict";
import { safeNext, validateName, validatePassword } from "./auth.ts";

test("validatePassword", () => {
  assert.match(validatePassword("short1")!, /at least 10/);
  assert.match(validatePassword("onlyletterslong")!, /letter and one number/);
  assert.match(validatePassword("1234567890123")!, /letter and one number/);
  assert.match(validatePassword("a1".repeat(40))!, /72/);
  assert.equal(validatePassword("correct horse 9"), null);
});

test("safeNext blocks open redirects", () => {
  assert.equal(safeNext("/settings"), "/settings");
  assert.equal(safeNext("/settings/password?x=1"), "/settings/password?x=1");
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined, "/ok\nx"]) {
    assert.equal(safeNext(bad as string | null | undefined), "/dashboard", String(bad));
  }
  assert.equal(safeNext("//x", "/home"), "/home");
});

test("validateName", () => {
  assert.equal(validateName("  "), "Please enter your name.");
  assert.ok(validateName("x".repeat(81)));
  assert.equal(validateName(" Maria Santos "), null);
});
