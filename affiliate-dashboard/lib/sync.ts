import "server-only";

export type SyncOutcome = "ok" | "partial" | "throttled" | "failed";

/** Calls the sync Edge Function. Callers MUST authorize first; the body scope is never client-supplied. */
export async function triggerSync(body: { profile_id?: string; connection_id?: string; source?: "manual" }): Promise<SyncOutcome> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sync-secret": process.env.SYNC_SECRET ?? "" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return "failed";
    const { results } = (await res.json()) as { results: { status: string }[] };
    if (results.some((r) => r.status === "throttled")) return "throttled";
    if (results.some((r) => r.status === "partial")) return "partial";
    return "ok";
  } catch {
    return "failed";
  }
}
