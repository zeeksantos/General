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

test("passwordStrength", async () => {
  const { passwordStrength, passwordChecks, isValidEmail } = await import("./auth.ts");
  assert.equal(passwordStrength("short1").label, "Too short");
  assert.equal(passwordStrength("password12345").label, "Weak");          // common word
  assert.equal(passwordStrength("aaaaaaaaaaaa1").label, "Weak");          // repeated characters
  assert.equal(passwordStrength("blue-River-tractor-92!").score, 4);
  assert.ok(passwordStrength("maria2026santos").score >= 2);
  assert.deepEqual(passwordChecks("abcdefghij1").map((c) => c.ok), [true, true, true]);
  assert.deepEqual(passwordChecks("123").map((c) => c.ok), [false, false, true]);
  assert.ok(isValidEmail("a@b.co") && !isValidEmail("a@b") && !isValidEmail("a b@c.com"));
});
