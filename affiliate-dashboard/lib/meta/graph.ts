import "server-only";
import { GRAPH_API_BASE } from "./config";

export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly subcode?: number,
    readonly status?: number,
  ) {
    super(message);
    this.name = "MetaApiError";
  }

  /** Token is invalid/expired/revoked: the connection should become `needs_reconnect`. */
  get isTokenError() {
    return this.code === 190 || this.status === 401;
  }
}

/** Calls the Graph API. The token goes in the Authorization header so it never lands in a URL or log. */
export async function graphGet<T>(
  path: string,
  params: Record<string, string> = {},
  token?: string,
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    throw new MetaApiError(e.message ?? `Graph API error ${res.status}`, e.code, e.error_subcode, res.status);
  }
  return body as T;
}
