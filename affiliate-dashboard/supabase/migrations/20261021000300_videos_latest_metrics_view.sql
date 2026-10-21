-- Phase 4: each video with its most recent daily metrics snapshot.
-- security_invoker => the caller's RLS applies (affiliates see only their own rows).
create view public.videos_with_latest_metrics
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
  m.avg_watch_time
from public.videos v
join public.connections c on c.id = v.connection_id
left join lateral (
  select * from public.video_metrics_daily d
  where d.video_id = v.id
  order by d.date desc
  limit 1
) m on true;

revoke all on public.videos_with_latest_metrics from anon;
grant select on public.videos_with_latest_metrics to authenticated;
