-- Phase 2: encrypted Meta token storage via Supabase Vault.
-- These functions are callable ONLY by the service role (server-side code).

create function public.store_token(p_secret text, p_name text, p_description text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return vault.create_secret(p_secret, p_name, p_description);
end;
$$;

create function public.read_token(p_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where id = p_id;
$$;

create function public.delete_token(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from vault.secrets where id = p_id;
$$;

revoke all on function public.store_token(text, text, text) from public, anon, authenticated;
revoke all on function public.read_token(uuid) from public, anon, authenticated;
revoke all on function public.delete_token(uuid) from public, anon, authenticated;
grant execute on function public.store_token(text, text, text) to service_role;
grant execute on function public.read_token(uuid) to service_role;
grant execute on function public.delete_token(uuid) to service_role;
