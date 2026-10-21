-- Phase 7: Meta data deletion callback support.

-- App-scoped Facebook user id, so a deletion request from Meta can be mapped to our data.
-- Not granted to clients (column-level select grants from Phase 1 don't include new columns).
alter table public.connections add column meta_user_id text;
create index connections_meta_user_id_idx on public.connections (meta_user_id) where meta_user_id is not null;

-- One row per deletion request, so Meta's status URL can show the outcome.
-- Deliberately stores no personal data (not even the Meta user id).
create table public.deletion_requests (
  code text primary key,
  status text not null default 'completed',
  connections_deleted integer not null default 0,
  requested_at timestamptz not null default now()
);
alter table public.deletion_requests enable row level security;  -- no policies: service role only
revoke all on public.deletion_requests from anon, authenticated;
