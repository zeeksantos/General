"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/config";
import { getActiveViewer, getViewer } from "@/lib/viewer";
import { deleteConnectionsForProfile } from "@/lib/meta/deletion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { triggerSync } from "@/lib/sync";

/** Triggers the sync Edge Function for the signed-in user's own connections. */
export async function syncNow() {
  const viewer = await getActiveViewer();
  if (!viewer) redirect("/dashboard");

  const outcome = DEMO_MODE ? "ok" : await triggerSync({ profile_id: viewer.id, source: "manual" }); // scoped to the caller, never client-supplied
  redirect(`/dashboard?synced=${outcome}`);
}

/** Permanently deletes the signed-in user's connections, tokens, statistics and account. */
export async function deleteMyData(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (DEMO_MODE) redirect("/dashboard?connect_error=demo");
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") redirect("/dashboard?delete_error=confirm");

  try {
    await deleteConnectionsForProfile(viewer.id); // tokens first, then rows (cascades to videos/metrics)
    const { error } = await createAdminClient().auth.admin.deleteUser(viewer.id); // cascades to the profile
    if (error) throw error;
  } catch {
    redirect("/dashboard?delete_error=failed");
  }
  await (await createClient()).auth.signOut();
  redirect("/login");
}
