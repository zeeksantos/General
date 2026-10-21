import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseSignedRequest } from "./signed-request.ts";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sign = (payload: object, secret: string) => {
  const p = b64url(Buffer.from(JSON.stringify(payload)));
  return `${b64url(createHmac("sha256", secret).update(p).digest())}.${p}`;
};

test("accepts a correctly signed request", () => {
  const out = parseSignedRequest(sign({ algorithm: "HMAC-SHA256", user_id: "123" }, "s3cret"), "s3cret");
  assert.equal(out?.user_id, "123");
});

test("rejects wrong secret, tampered payload, bad algorithm and junk", () => {
  const good = sign({ algorithm: "HMAC-SHA256", user_id: "123" }, "s3cret");
  assert.equal(parseSignedRequest(good, "other"), null);
  const [sig] = good.split(".");
  const forged = `${sig}.${b64url(Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "999" })))}`;
  assert.equal(parseSignedRequest(forged, "s3cret"), null);
  assert.equal(parseSignedRequest(sign({ algorithm: "none", user_id: "1" }, "s3cret"), "s3cret"), null);
  for (const junk of ["", "abc", "a.b.c", "."]) assert.equal(parseSignedRequest(junk, "s3cret"), null);
});
