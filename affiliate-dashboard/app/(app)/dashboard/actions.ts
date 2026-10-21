"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Triggers the sync Edge Function for the signed-in user's own connections. */
export async function syncNow() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let outcome = "ok";
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sync-secret": process.env.SYNC_SECRET ?? "" },
      body: JSON.stringify({ profile_id: user.id }), // scoped to the caller, never client-supplied
      cache: "no-store",
    });
    if (!res.ok) outcome = "failed";
    else {
      const { results } = (await res.json()) as { results: { status: string }[] };
      if (results.some((r) => r.status === "throttled")) outcome = "throttled";
      else if (results.some((r) => r.status === "partial")) outcome = "partial";
    }
  } catch {
    outcome = "failed";
  }
  redirect(`/dashboard?synced=${outcome}`);
}
