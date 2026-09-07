-- Draft for root to review/apply. Daily aggregate metrics only; no user IDs,
-- raw IPs, user agents, query strings, referrers, or contact content.
create table public.site_metrics_daily (
  metric_day date not null,
  event_name text not null check (event_name in ('page_view','sound_play','soundboard_return','inquiry_submitted')),
  page_path text not null check (length(page_path) <= 112),
  event_count bigint not null default 0 check (event_count >= 0),
  primary key (metric_day, event_name, page_path)
);
alter table public.site_metrics_daily enable row level security;
revoke all on public.site_metrics_daily from public, anon, authenticated;
grant select on public.site_metrics_daily to authenticated;
grant select, insert, update, delete on public.site_metrics_daily to service_role;
create policy "Gio reads site measurements" on public.site_metrics_daily for select to authenticated using ((select public.is_gio_admin()));

create table public.site_metric_dedupe (
  event_id uuid primary key,
  received_at timestamptz not null default now()
);
create index site_metric_dedupe_retention on public.site_metric_dedupe(received_at);
alter table public.site_metric_dedupe enable row level security;
revoke all on public.site_metric_dedupe from public, anon, authenticated;
grant select, insert, delete on public.site_metric_dedupe to service_role;

create table public.site_metric_limits (
  bucket text not null check (length(bucket) <= 80),
  period_start timestamptz not null,
  hits integer not null default 1 check (hits > 0 and hits <= 20001),
  primary key (bucket, period_start)
);
create index site_metric_limits_retention on public.site_metric_limits(period_start);
alter table public.site_metric_limits enable row level security;
revoke all on public.site_metric_limits from public, anon, authenticated;
grant select, insert, update, delete on public.site_metric_limits to service_role;

create or replace function public.purge_site_metrics() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.site_metrics_daily where metric_day < (now() at time zone 'UTC')::date - 89;
  delete from public.site_metric_dedupe where received_at < now() - interval '48 hours';
  delete from public.site_metric_limits where period_start < now() - interval '48 hours';
end;
$$;
revoke all on function public.purge_site_metrics() from public, anon, authenticated;
grant execute on function public.purge_site_metrics() to service_role;

create or replace function public.record_site_metric(p_event_id uuid, p_event_name text, p_path text, p_rate_key text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  v_minute timestamptz := date_trunc('minute', now());
  v_hits integer;
  v_inserted integer;
begin
  if p_event_id is null or p_event_name is null or p_event_name not in ('page_view','sound_play','soundboard_return','inquiry_submitted')
    or p_path is null or length(p_path) > 112 or p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then return false; end if;
  if p_path not in ('/','/about','/projects','/blog','/contact','/soundboard','/sitemap') then
    if p_path ~ '^/projects/[a-z0-9][a-z0-9-]{0,99}$' then
      if not exists (select 1 from public.projects where slug = substr(p_path, 11) and visibility = 'public') then return false; end if;
    elsif p_path ~ '^/blog/[1-9][0-9]{0,12}$' then
      if not exists (select 1 from public.blog_posts where id::text = substr(p_path, 7) and status = 'published') then return false; end if;
    else return false; end if;
  end if;
  if p_event_name in ('sound_play','soundboard_return') and p_path <> '/soundboard' then return false; end if;

  -- A shared row serializes quota updates, so concurrency cannot exceed the cap.
  -- Limits count attempts, not only accepted metrics; CORS is not authentication.
  insert into public.site_metric_limits(bucket,period_start,hits) values ('global',v_day_start,1)
    on conflict (bucket,period_start) do update set hits = least(public.site_metric_limits.hits + 1,20001)
    returning hits into v_hits;
  if v_hits = 1 then perform public.purge_site_metrics(); end if;
  if v_hits > 20000 then return false; end if;
  insert into public.site_metric_limits(bucket,period_start,hits) values ('day:' || p_rate_key,v_day_start,1)
    on conflict (bucket,period_start) do update set hits = least(public.site_metric_limits.hits + 1,20001)
    returning hits into v_hits;
  if v_hits > 1000 then return false; end if;
  insert into public.site_metric_limits(bucket,period_start,hits) values ('minute:' || p_rate_key,v_minute,1)
    on conflict (bucket,period_start) do update set hits = least(public.site_metric_limits.hits + 1,20001)
    returning hits into v_hits;
  if v_hits > 120 then return false; end if;
  insert into public.site_metric_dedupe(event_id) values (p_event_id) on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return false; end if;
  insert into public.site_metrics_daily(metric_day,event_name,page_path,event_count)
    values (v_day,p_event_name,p_path,1)
    on conflict (metric_day,event_name,page_path) do update set event_count = public.site_metrics_daily.event_count + 1;
  return true;
end;
$$;
revoke all on function public.record_site_metric(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.record_site_metric(uuid,text,text,text) to service_role;

create or replace function public.site_metrics_summary(p_days integer default 30) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_days integer := case when p_days in (7,30,90) then p_days else 30 end;
  v_since date := (now() at time zone 'UTC')::date - (v_days - 1);
  v_result jsonb;
begin
  if public.is_gio_admin() is distinct from true then raise insufficient_privilege using message = 'Owner access required'; end if;
  with metrics as (
    select * from public.site_metrics_daily where metric_day >= v_since and metric_day <= (now() at time zone 'UTC')::date
  ), paths as (
    select page_path,
      coalesce(sum(event_count) filter (where event_name = 'page_view'),0) as views,
      coalesce(sum(event_count) filter (where event_name = 'inquiry_submitted'),0) as inquiries
    from metrics group by page_path
  ), days as (
    select metric_day, coalesce(sum(event_count) filter (where event_name = 'page_view'),0) as views,
      coalesce(sum(event_count) filter (where event_name = 'inquiry_submitted'),0) as inquiries
    from metrics group by metric_day
  )
  select jsonb_build_object(
    'days',v_days,'since',v_since,'through',(now() at time zone 'UTC')::date,
    'first_day',(select min(metric_day) from public.site_metrics_daily),
    'page_views',coalesce((select sum(event_count) from metrics where event_name='page_view'),0),
    'project_views',coalesce((select sum(event_count) from metrics where event_name='page_view' and page_path like '/projects/%'),0),
    'inquiries',coalesce((select sum(event_count) from metrics where event_name='inquiry_submitted'),0),
    'soundboard_views',coalesce((select sum(event_count) from metrics where event_name='page_view' and page_path='/soundboard'),0),
    'sound_plays',coalesce((select sum(event_count) from metrics where event_name='sound_play'),0),
    'soundboard_returns',coalesce((select sum(event_count) from metrics where event_name='soundboard_return'),0),
    'top_pages',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from paths order by views desc,page_path limit 20) t),'[]'::jsonb),
    'top_projects',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from paths where page_path like '/projects/%' order by views desc,page_path limit 20) t),'[]'::jsonb),
    'inquiry_sources',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from paths where inquiries > 0 order by inquiries desc,page_path limit 20) t),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from days order by metric_day desc limit 90) t),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.site_metrics_summary(integer) from public, anon;
grant execute on function public.site_metrics_summary(integer) to authenticated;

select cron.schedule('luis-site-metrics-retention', '17 3 * * *', 'select public.purge_site_metrics()');
-- Ingestion also runs cleanup on the first valid attempt each UTC day.
