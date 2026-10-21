"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/config";
import { getViewer } from "@/lib/viewer";
import { triggerSync } from "@/lib/sync";

/** Triggers the sync Edge Function for the signed-in user's own connections. */
export async function syncNow() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const outcome = DEMO_MODE ? "ok" : await triggerSync({ profile_id: viewer.id }); // scoped to the caller, never client-supplied
  redirect(`/dashboard?synced=${outcome}`);
}
