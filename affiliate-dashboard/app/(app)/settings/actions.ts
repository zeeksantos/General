"use server";

import { redirect } from "next/navigation";
import { validateName } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function updateProfile(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const name = String(formData.get("name") ?? "");
  if (validateName(name)) redirect("/settings?saved=invalid");
  if (DEMO_MODE) redirect("/settings?saved=demo");

  // Runs as the signed-in user: RLS + the column grant only allow editing their own `name`.
  const { error } = await (await createClient()).from("profiles").update({ name: name.trim() }).eq("id", viewer.id);
  redirect(`/settings?saved=${error ? "failed" : "ok"}`);
}
