import test from "node:test";
import assert from "node:assert/strict";
import { checkUserAction, parseInviteEmails, type UserAction } from "./admin-users.ts";

const u = (o: Partial<{ id: string; role: "affiliate" | "admin"; status: "pending" | "active" | "suspended" }> = {}) =>
  ({ id: "t", role: "affiliate" as const, status: "active" as const, ...o });
const ok = (a: string, t: ReturnType<typeof u>, act: UserAction, admins = 2) => assert.equal(checkUserAction(a, t, act, admins), null);
const no = (a: string, t: ReturnType<typeof u>, act: UserAction, admins = 2) => assert.ok(checkUserAction(a, t, act, admins), `${act} should be blocked`);

test("approve / reactivate only from the right state", () => {
  ok("me", u({ status: "pending" }), "approve"); no("me", u({ status: "active" }), "approve");
  ok("me", u({ status: "suspended" }), "reactivate"); no("me", u({ status: "pending" }), "reactivate");
});

test("suspend rules", () => {
  ok("me", u(), "suspend");
  no("me", u({ id: "me" }), "suspend");               // not yourself
  no("me", u({ role: "admin" }), "suspend");          // demote first
  no("me", u({ status: "pending" }), "suspend");
});

test("admin role changes never leave zero admins or lock out yourself", () => {
  ok("me", u(), "make_admin"); no("me", u({ status: "pending" }), "make_admin"); no("me", u({ role: "admin" }), "make_admin");
  ok("me", u({ role: "admin" }), "remove_admin", 2);
  no("me", u({ role: "admin" }), "remove_admin", 1);  // last admin
  no("me", u({ id: "me", role: "admin" }), "remove_admin", 5); // yourself
  no("me", u(), "remove_admin");
});

test("delete rules", () => {
  ok("me", u(), "delete"); ok("me", u({ status: "pending" }), "delete");
  no("me", u({ id: "me" }), "delete"); no("me", u({ role: "admin" }), "delete");
});

test("parseInviteEmails", () => {
  const r = parseInviteEmails("A@x.com, b@y.org;  a@x.com\nnot-an-email  c@z.co");
  assert.deepEqual(r.valid, ["a@x.com", "b@y.org", "c@z.co"]);
  assert.deepEqual(r.invalid, ["not-an-email"]);
  assert.equal(r.tooMany, false);
  const many = parseInviteEmails(Array.from({ length: 25 }, (_, i) => `u${i}@x.com`).join(" "));
  assert.equal(many.valid.length, 20); assert.equal(many.tooMany, true);
  assert.deepEqual(parseInviteEmails("  ").valid, []);
});
