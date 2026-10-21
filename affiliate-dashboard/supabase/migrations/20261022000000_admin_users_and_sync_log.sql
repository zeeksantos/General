-- Controlled sign-up (approval / invites / suspension), sync run log, and notification outbox.

-- ------------------------------------------------------------- account status
create type public.profile_status as enum ('pending', 'active', 'suspended');
-- Existing users stay active; the sign-up trigger decides for new ones.
alter table public.profiles add column status public.profile_status not null default 'active';

-- Single-row settings table. Service role only (admins change it through server actions).
create table public.app_settings (
  id boolean primary key default true check (id),
  signup_mode text not null default 'approval' check (signup_mode in ('open', 'approval')),
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (true);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

-- Invited emails skip approval. Service role only.
create table public.invites (
  email text primary key check (email = lower(email)),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;

create function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active');
$$;
revoke all on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

-- A suspended or pending admin has no admin powers.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

-- Own data is readable only while the account is active (this is what enforces suspension).
alter policy "connections_select" on public.connections
  using ((profile_id = (select auth.uid()) and public.is_active()) or public.is_admin());

alter policy "videos_select" on public.videos
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.connections c
      where c.id = videos.connection_id and c.profile_id = (select auth.uid())
    ))
  );

alter policy "video_metrics_daily_select" on public.video_metrics_daily
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.videos v
      join public.connections c on c.id = v.connection_id
      where v.id = video_metrics_daily.video_id and c.profile_id = (select auth.uid())
    ))
  );

alter policy "account_metrics_daily_select" on public.account_metrics_daily
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.connections c
      where c.id = account_metrics_daily.connection_id and c.profile_id = (select auth.uid())
    ))
  );

-- New sign-ups: active if their email was invited or sign-up is open, otherwise pending approval.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_invited boolean;
begin
  select signup_mode into v_mode from public.app_settings where id;
  update public.invites set accepted_at = now()
    where email = lower(new.email) and accepted_at is null
    returning true into v_invited;

  insert into public.profiles (id, name, email, terms_accepted_at, status)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80),
    new.email,
    case when new.raw_user_meta_data ->> 'terms_accepted' = 'true' then now() end,
    case when v_invited is true or v_mode = 'open' then 'active'::public.profile_status
         else 'pending'::public.profile_status end
  );
  return new;
end;
$$;

-- ------------------------------------------------------------------ sync log
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  source text not null default 'cron' check (source in ('cron', 'manual')),
  connection_id uuid references public.connections (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  platform public.platform,
  status text not null,
  videos integer not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  duration_ms integer
);
create index sync_runs_started_idx on public.sync_runs (started_at desc);
alter table public.sync_runs enable row level security;
create policy "sync_runs_select_admin" on public.sync_runs for select to authenticated using (public.is_admin());
revoke all on public.sync_runs from anon;
revoke insert, update, delete on public.sync_runs from authenticated;

-- ------------------------------------------------------ notification outbox
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  profile_id uuid references public.profiles (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error text
);
create index notifications_unsent_idx on public.notifications (created_at) where sent_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;

-- Queue one alert when a connection first becomes "needs reconnect".
create function public.queue_reconnect_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'needs_reconnect' and old.status is distinct from 'needs_reconnect' then
    insert into public.notifications (kind, profile_id, payload)
    values ('connection_needs_reconnect', new.profile_id,
            jsonb_build_object('platform', new.platform, 'account_name', new.account_name));
  end if;
  return new;
end;
$$;
revoke all on function public.queue_reconnect_notification() from public, anon, authenticated;

create trigger connections_reconnect_notification
  after update of status on public.connections
  for each row execute function public.queue_reconnect_notification();

-- Daily at 19:30 UTC (03:30 Manila), 30 minutes after the sync: the app's /api/notify route sends the emails.
-- Needs the Vault secret `notify_url` (e.g. https://<domain>/api/notify); `sync_secret` already exists.
select cron.schedule(
  'daily-notify',
  '30 19 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
