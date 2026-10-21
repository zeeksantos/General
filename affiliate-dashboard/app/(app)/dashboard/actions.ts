"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { triggerSync } from "@/lib/sync";

/** Triggers the sync Edge Function for the signed-in user's own connections. */
export async function syncNow() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const outcome = await triggerSync({ profile_id: user.id }); // scoped to the caller, never client-supplied
  redirect(`/dashboard?synced=${outcome}`);
}
