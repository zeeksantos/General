-- Phase 5: let admins identify affiliates (email) and show who owns each video.

alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.email);
  return new;
end;
$$;

-- Append-only change (create or replace view can only add columns at the end).
create or replace view public.videos_with_latest_metrics
with (security_invoker = true) as
select
  v.id, v.connection_id, c.profile_id, c.account_name,
  v.platform, v.external_id, v.caption, v.permalink, v.thumbnail_url,
  v.media_type, v.published_at, v.duration_seconds,
  coalesce(m.views, 0) as views,
  coalesce(m.reach, 0) as reach,
  coalesce(m.link_clicks, 0) as link_clicks,
  coalesce(m.likes, 0) as likes,
  coalesce(m.comments, 0) as comments,
  coalesce(m.shares, 0) as shares,
  coalesce(m.saves, 0) as saves,
  m.avg_watch_time,
  coalesce(nullif(p.name, ''), p.email, 'Unknown') as profile_name
from public.videos v
join public.connections c on c.id = v.connection_id
left join public.profiles p on p.id = c.profile_id
left join lateral (
  select * from public.video_metrics_daily d
  where d.video_id = v.id
  order by d.date desc
  limit 1
) m on true;
