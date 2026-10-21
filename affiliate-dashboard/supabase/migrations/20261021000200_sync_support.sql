-- Phase 3: sync support (duration, account-level IG link taps, daily cron).

alter table public.videos add column duration_seconds numeric;

-- Instagram has no per-video link-click metric; profile link taps are tracked per account/day.
create table public.account_metrics_daily (
  connection_id uuid not null references public.connections (id) on delete cascade,
  date date not null,
  profile_link_taps bigint not null default 0,
  primary key (connection_id, date)
);
alter table public.account_metrics_daily enable row level security;
create policy "account_metrics_daily_select" on public.account_metrics_daily for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.connections c
      where c.id = account_metrics_daily.connection_id and c.profile_id = (select auth.uid())
    )
  );
revoke all on public.account_metrics_daily from anon;
revoke insert, update, delete on public.account_metrics_daily from authenticated;

-- Daily schedule: 03:00 Asia/Manila = 19:00 UTC.
-- Before this works, create two Vault secrets (SQL editor):
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/sync', 'sync_function_url');
--   select vault.create_secret('<same value as the SYNC_SECRET function secret>', 'sync_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-meta-sync',
  '0 19 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
