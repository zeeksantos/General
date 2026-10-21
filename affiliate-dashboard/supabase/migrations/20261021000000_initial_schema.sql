-- Phase 1: core schema + Row Level Security.
-- Meta tokens live in Supabase Vault; `connections` only stores the Vault secret id.

create type public.user_role as enum ('affiliate', 'admin');
-- New platforms (e.g. tiktok) can be added later with: alter type public.platform add value 'tiktok';
create type public.platform as enum ('facebook', 'instagram');
create type public.connection_status as enum ('active', 'needs_reconnect', 'disconnected');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role public.user_role not null default 'affiliate',
  created_at timestamptz not null default now()
);

-- Auto-create a profile for every new auth user (always an affiliate; admins are promoted manually).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by RLS policies. security definer so it can read profiles without recursing into RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ------------------------------------------------------------- connections
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform public.platform not null,
  external_account_id text not null,
  account_name text not null default '',
  token_secret_id uuid,                -- vault.secrets id; never exposed to clients
  token_expires_at timestamptz,
  status public.connection_status not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, platform, external_account_id)
);
create index connections_profile_id_idx on public.connections (profile_id);

-- ------------------------------------------------------------------ videos
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  platform public.platform not null,
  external_id text not null,
  caption text,
  permalink text,
  thumbnail_url text,
  media_type text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (connection_id, external_id)
);
create index videos_connection_published_idx on public.videos (connection_id, published_at desc);

-- ------------------------------------------------------ video_metrics_daily
create table public.video_metrics_daily (
  video_id uuid not null references public.videos (id) on delete cascade,
  date date not null,
  views bigint not null default 0,
  reach bigint not null default 0,
  link_clicks bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  avg_watch_time numeric,              -- seconds
  primary key (video_id, date)
);
create index video_metrics_daily_date_idx on public.video_metrics_daily (date);

-- --------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.videos enable row level security;
alter table public.video_metrics_daily enable row level security;

-- profiles: own row (or all, for admins). Users may only edit their own name — never their role.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- connections: read-only for clients; all writes go through the service role (OAuth + sync).
create policy "connections_select" on public.connections for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());
revoke select on public.connections from authenticated;
grant select (id, profile_id, platform, external_account_id, account_name,
              token_expires_at, status, last_synced_at, created_at)
  on public.connections to authenticated;

-- videos / metrics: visible when the parent connection is visible.
create policy "videos_select" on public.videos for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.connections c
      where c.id = videos.connection_id and c.profile_id = (select auth.uid())
    )
  );

create policy "video_metrics_daily_select" on public.video_metrics_daily for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.videos v
      join public.connections c on c.id = v.connection_id
      where v.id = video_metrics_daily.video_id and c.profile_id = (select auth.uid())
    )
  );

-- Only the service role may write to videos, video_metrics_daily and connections.
revoke insert, update, delete on public.connections, public.videos, public.video_metrics_daily
  from anon, authenticated;
revoke all on public.profiles, public.connections, public.videos, public.video_metrics_daily from anon;
