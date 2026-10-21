"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPages } from "@/lib/meta/oauth";
import { deleteToken, readToken, storeToken } from "@/lib/meta/tokens";

const PENDING_COOKIE = "meta_pending_token";

export async function selectPage(formData: FormData) {
  const pageId = String(formData.get("page_id") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jar = await cookies();
  const pendingId = jar.get(PENDING_COOKIE)?.value;
  if (!pendingId || !pageId) redirect("/dashboard?connect_error=expired");

  let outcome = "connected";
  try {
    const userToken = await readToken(pendingId);
    const page = (await listPages(userToken)).find((p) => p.id === pageId);
    if (!page) redirect("/dashboard?connect_error=page");

    const admin = createAdminClient();
    const targets = [
      { platform: "facebook", externalId: page.id, name: page.name },
      ...(page.instagram_business_account
        ? [{
            platform: "instagram",
            externalId: page.instagram_business_account.id,
            name: page.instagram_business_account.username ?? page.name,
          }]
        : []),
    ] as const;

    for (const t of targets) {
      // Page tokens derived from a long-lived user token don't expire, so token_expires_at stays null.
      const secretId = await storeToken(page.access_token, `meta-${t.platform}-${t.externalId}-${user.id}`, t.name);
      const { data: existing } = await admin
        .from("connections")
        .select("token_secret_id")
        .eq("profile_id", user.id)
        .eq("platform", t.platform)
        .eq("external_account_id", t.externalId)
        .maybeSingle();

      const { error } = await admin.from("connections").upsert(
        {
          profile_id: user.id,
          platform: t.platform,
          external_account_id: t.externalId,
          account_name: t.name,
          token_secret_id: secretId,
          token_expires_at: null,
          status: "active",
        },
        { onConflict: "profile_id,platform,external_account_id" },
      );
      if (error) {
        await deleteToken(secretId);
        throw new Error("connection upsert failed");
      }
      if (existing?.token_secret_id) await deleteToken(existing.token_secret_id);
    }
    if (!page.instagram_business_account) outcome = "no_instagram";
  } catch (e) {
    // redirect() throws a control-flow error (it carries a digest); let it through.
    if (typeof e === "object" && e && "digest" in e) throw e;
    redirect("/dashboard?connect_error=exchange");
  }

  await deleteToken(pendingId);
  jar.delete({ name: PENDING_COOKIE, path: "/connect" });
  redirect(`/dashboard?connected=${outcome}`);
}

export async function disconnect(formData: FormData) {
  const id = String(formData.get("connection_id") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("connections")
    .select("id, token_secret_id")
    .eq("id", id)
    .eq("profile_id", user.id) // ownership check: service role bypasses RLS
    .maybeSingle();
  if (conn) {
    await admin.from("connections").delete().eq("id", conn.id);
    if (conn.token_secret_id) await deleteToken(conn.token_secret_id);
  }
  redirect("/dashboard");
}
