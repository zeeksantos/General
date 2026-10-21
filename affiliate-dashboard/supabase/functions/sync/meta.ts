// Graph API client for the sync function (Deno). Version comes from the single app-wide constant.
import { GRAPH_API_BASE } from "../../../lib/meta/config.ts";
import { isRateLimitCode, isTokenCode, parseUsage } from "./parse.ts";

export class MetaError extends Error {
  constructor(message: string, readonly code?: number, readonly status?: number) {
    super(message);
  }
  get isToken() { return isTokenCode(this.code, this.status); }
  get isRateLimit() { return isRateLimitCode(this.code); }
}

/** Thrown when Meta says we are near/over a limit; the run stops cleanly and retries next time. */
export class ThrottledError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function graphGet<T = any>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // token never in the URL
  const usage = parseUsage(res.headers);
  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.error) {
    const e = body.error ?? {};
    const err = new MetaError(e.message ?? `Graph error ${res.status}`, e.code, res.status);
    if (err.isRateLimit) throw new ThrottledError(err.message);
    throw err;
  }
  // Back off before the limit is hit.
  if (usage.regainMinutes > 0 || usage.pct >= 90) throw new ThrottledError(`Meta usage at ${usage.pct}%`);
  if (usage.pct >= 70) await sleep(5000);
  return body as T;
}

/** Follows `paging.next` until `stop(item)` is true or pages run out. */
export async function* paginate<T extends Record<string, any>>(
  path: string, params: Record<string, string>, token: string,
): AsyncGenerator<T> {
  let page = await graphGet<{ data: T[]; paging?: { cursors?: { after?: string }; next?: string } }>(path, params, token);
  while (true) {
    for (const item of page.data ?? []) yield item;
    const after = page.paging?.cursors?.after;
    if (!page.paging?.next || !after) return;
    page = await graphGet(path, { ...params, after }, token);
  }
}

/**
 * Fetches insight metrics in one call; if Meta rejects the set (a retired or unsupported metric),
 * retries one metric at a time and skips the ones that fail, so one bad metric can't zero a video.
 */
export async function insightsTolerant(
  path: string, metrics: string[], extra: Record<string, string>, token: string,
  parse: (body: any) => Record<string, unknown>, warnings: string[],
): Promise<Record<string, unknown>> {
  try {
    return parse(await graphGet(path, { metric: metrics.join(","), ...extra }, token));
  } catch (e) {
    if (!(e instanceof MetaError) || e.isToken) throw e;
  }
  const out: Record<string, unknown> = {};
  for (const m of metrics) {
    try {
      Object.assign(out, parse(await graphGet(path, { metric: m, ...extra }, token)));
    } catch (e) {
      if (!(e instanceof MetaError) || e.isToken) throw e;
      warnings.push(`metric ${m} unavailable for ${path}: ${e.message}`);
    }
  }
  return out;
}
