-- The sync function authenticates callers (pg_cron, the app) against the Vault secret `sync_secret`,
-- so no Edge Function secret has to be configured by hand.
-- Compares SHA-256 digests so the comparison does not leak the secret's prefix through timing.
create function public.check_sync_secret(p_given text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (select extensions.digest(decrypted_secret, 'sha256') = extensions.digest(p_given, 'sha256')
       from vault.decrypted_secrets where name = 'sync_secret' limit 1),
    false);
$$;

revoke all on function public.check_sync_secret(text) from public, anon, authenticated;
grant execute on function public.check_sync_secret(text) to service_role;
