import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteToken } from "./tokens";

/**
 * Permanently removes connections: Vault tokens first (they would be orphaned by the cascade),
 * then the rows, which cascade to videos and metrics. Returns how many connections were removed.
 */
async function deleteConnections(filter: { profile_id?: string; meta_user_id?: string }): Promise<number> {
  const admin = createAdminClient();
  let q = admin.from("connections").select("id, token_secret_id");
  if (filter.profile_id) q = q.eq("profile_id", filter.profile_id);
  if (filter.meta_user_id) q = q.eq("meta_user_id", filter.meta_user_id);
  if (!filter.profile_id && !filter.meta_user_id) throw new Error("refusing to delete without a filter");

  const { data, error } = await q;
  if (error) throw new Error("could not list connections");
  for (const c of data ?? []) if (c.token_secret_id) await deleteToken(c.token_secret_id);

  const ids = (data ?? []).map((c) => c.id);
  if (ids.length) {
    const { error: delErr } = await admin.from("connections").delete().in("id", ids);
    if (delErr) throw new Error("could not delete connections");
  }
  return ids.length;
}

export const deleteConnectionsForProfile = (profile_id: string) => deleteConnections({ profile_id });
export const deleteConnectionsForMetaUser = (meta_user_id: string) => deleteConnections({ meta_user_id });
