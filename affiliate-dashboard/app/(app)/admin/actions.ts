"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { triggerSync } from "@/lib/sync";

/** Re-syncs one affiliate. Admin-only: the role is read with the caller's own session (RLS), not trusted from the form. */
export async function resyncAffiliate(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const outcome = profileId ? await triggerSync({ profile_id: profileId }) : "failed";
  redirect(`/admin?synced=${outcome}&who=${encodeURIComponent(profileId)}`);
}
