"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/config";
import { getViewer } from "@/lib/viewer";
import { triggerSync } from "@/lib/sync";

/** Re-syncs one affiliate. Admin-only: the role is read with the caller's own session (RLS) via getViewer(), not trusted from the form. */
export async function resyncAffiliate(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin") redirect("/dashboard");

  const outcome = DEMO_MODE ? "ok" : profileId ? await triggerSync({ profile_id: profileId }) : "failed";
  redirect(`/admin?synced=${outcome}&who=${encodeURIComponent(profileId)}`);
}
