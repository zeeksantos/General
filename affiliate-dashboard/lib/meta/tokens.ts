import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Thin wrappers over the service-role-only Vault functions (see migrations).
export async function storeToken(secret: string, name: string, description = "") {
  const { data, error } = await createAdminClient().rpc("store_token", {
    p_secret: secret,
    p_name: name,
    p_description: description,
  });
  if (error) throw new Error("Could not store token");
  return data as string;
}

export async function readToken(id: string) {
  const { data, error } = await createAdminClient().rpc("read_token", { p_id: id });
  if (error || !data) throw new Error("Could not read token");
  return data as string;
}

export async function deleteToken(id: string) {
  await createAdminClient().rpc("delete_token", { p_id: id });
}
