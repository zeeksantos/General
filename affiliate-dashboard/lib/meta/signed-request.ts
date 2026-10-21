import { createHmac, timingSafeEqual } from "node:crypto";

const b64urlDecode = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export type SignedPayload = { user_id?: string; algorithm?: string; [k: string]: unknown };

/**
 * Verifies a Meta `signed_request` ("<sig>.<payload>", HMAC-SHA256 of the payload keyed with the app secret)
 * and returns the payload, or null if it is malformed or the signature is wrong.
 */
export function parseSignedRequest(signedRequest: string, appSecret: string): SignedPayload | null {
  const [sig, payload, ...rest] = signedRequest.split(".");
  if (!sig || !payload || rest.length) return null;
  try {
    const expected = createHmac("sha256", appSecret).update(payload).digest();
    const given = b64urlDecode(sig);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const data = JSON.parse(b64urlDecode(payload).toString("utf8")) as SignedPayload;
    if (data.algorithm && String(data.algorithm).toUpperCase() !== "HMAC-SHA256") return null;
    return data;
  } catch {
    return null;
  }
}
