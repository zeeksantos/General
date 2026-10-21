"use server";

import { redirect } from "next/navigation";
import { checkUserAction, parseInviteEmails, type UserAction } from "@/lib/admin-users";
import { DEMO_MODE } from "@/lib/config";
import { emailConfigured, sendEmail } from "@/lib/email";
import { deleteConnectionsForProfile } from "@/lib/meta/deletion";
import { approvedEmail } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

const ACTIONS: UserAction[] = ["approve", "suspend", "reactivate", "make_admin", "remove_admin", "delete"];
const back = (qs: string) => redirect(`/admin/users?${qs}`);
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** The role is re-checked on every call: never trust that the page was only shown to admins. */
async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin" || viewer.status !== "active") redirect("/dashboard");
  return viewer;
}

export async function userAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("user_id") ?? "");
  const action = String(formData.get("action") ?? "") as UserAction;
  if (!id || !ACTIONS.includes(action)) back("error=Invalid%20request");
  if (DEMO_MODE) back("demo=1");

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, name, email, role, status").eq("id", id).maybeSingle();
  if (!target) back("error=That%20user%20no%20longer%20exists");
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("status", "active");

  const blocked = checkUserAction(actor.id, target!, action, count ?? 0);
  if (blocked) back(`error=${encodeURIComponent(blocked)}`);

  let note = "";
  if (action === "delete") {
    try {
      await deleteConnectionsForProfile(id); // Vault tokens first, then rows (cascades to videos and metrics)
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
    } catch {
      back("error=Couldn%27t%20delete%20that%20user.%20Please%20try%20again");
    }
  } else {
    const patch =
      action === "approve" || action === "reactivate" ? { status: "active" as const }
      : action === "suspend" ? { status: "suspended" as const }
      : action === "make_admin" ? { role: "admin" as const }
      : { role: "affiliate" as const };
    const { error } = await admin.from("profiles").update(patch).eq("id", id);
    if (error) back("error=Couldn%27t%20save%20that%20change.%20Please%20try%20again");

    if (action === "approve" && target!.email) {
      const sent = await sendEmail(target!.email, approvedEmail(target!.name, siteUrl()));
      note = sent.ok ? "" : emailConfigured() ? "&mail=failed" : "&mail=off";
    }
  }
  back(`done=${action}${note}`);
}

export async function inviteUsers(formData: FormData) {
  const actor = await requireAdmin();
  const { valid, invalid, tooMany } = parseInviteEmails(String(formData.get("emails") ?? ""));
  if (valid.length === 0) back("error=Enter%20at%20least%20one%20valid%20email%20address");
  if (DEMO_MODE) back("demo=1");

  const admin = createAdminClient();
  let invited = 0, approved = 0, existing = 0, failed = 0;
  for (const email of valid) {
    const { data: profile } = await admin.from("profiles").select("id, status").eq("email", email).maybeSingle();
    if (profile) {
      // They already have an account: an invite just approves it.
      if (profile.status === "pending") { await admin.from("profiles").update({ status: "active" }).eq("id", profile.id); approved++; }
      else existing++;
      continue;
    }
    // The invite row must exist BEFORE the user does, so the sign-up trigger marks them active.
    const { error: invErr } = await admin.from("invites").upsert({ email, invited_by: actor.id, accepted_at: null }, { onConflict: "email" });
    if (invErr) { failed++; continue; }
    const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/settings/password` });
    // If the email can't be sent the invite still works: they can sign up with this address and skip approval.
    if (error) failed++; else invited++;
  }
  back(`invited=${invited}&approved=${approved}&existing=${existing}&failed=${failed}&invalid=${invalid.length}${tooMany ? "&many=1" : ""}`);
}

export async function setSignupMode(formData: FormData) {
  await requireAdmin();
  const mode = String(formData.get("mode") ?? "");
  if (mode !== "open" && mode !== "approval") back("error=Invalid%20request");
  if (DEMO_MODE) back("demo=1");
  const { error } = await createAdminClient().from("app_settings").update({ signup_mode: mode, updated_at: new Date().toISOString() }).eq("id", true);
  back(error ? "error=Couldn%27t%20save%20the%20setting" : `mode=${mode}`);
}
