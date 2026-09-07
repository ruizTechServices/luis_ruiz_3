-- Synthetic metrics and quota changes are rolled back; no existing visitor,
-- contact, auth or content data is changed or returned.
begin;
do $$
declare
  v_owner uuid;
  v_visitor uuid;
  v_event uuid := gen_random_uuid();
  v_key text := repeat('f',64);
  v_day date := (now() at time zone 'UTC')::date;
  v_day_start timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  v_before bigint;
  v_after bigint;
  v_summary jsonb;
begin
  select id into strict v_owner from auth.users where lower(email)='giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null;
  select id into strict v_visitor from auth.users where lower(email)<>'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null limit 1;
  if has_function_privilege('anon','public.record_site_metric(uuid,text,text,text)','execute')
    or has_function_privilege('authenticated','public.record_site_metric(uuid,text,text,text)','execute')
    or has_function_privilege('anon','public.site_metrics_summary(integer)','execute')
    or has_table_privilege('anon','public.site_metrics_daily','select')
    or has_table_privilege('authenticated','public.site_metrics_daily','insert')
    or has_table_privilege('authenticated','public.site_metric_limits','select')
    or has_table_privilege('authenticated','public.site_metric_dedupe','select') then raise exception 'Metric API grants expose protected operations'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('record_site_metric','site_metrics_summary','purge_site_metrics') and p.prosecdef) then raise exception 'Metric functions must be SECURITY INVOKER'; end if;

  execute 'set local role service_role';
  delete from public.site_metric_limits where bucket='global' and period_start=v_day_start;
  select coalesce(sum(event_count),0) into v_before from public.site_metrics_daily where metric_day=v_day and event_name='page_view' and page_path='/';
  if public.record_site_metric(gen_random_uuid(),'page_view','/dashboard/write',v_key) then raise exception 'Private route accepted'; end if;
  if public.record_site_metric(gen_random_uuid(),'sound_play','/about',v_key) then raise exception 'Invalid event/path accepted'; end if;
  if public.record_site_metric(gen_random_uuid(),'page_view','/projects/missing-metric-fixture',v_key) then raise exception 'Missing project accepted'; end if;
  if not public.record_site_metric(v_event,'page_view','/',v_key) then raise exception 'Valid metric rejected'; end if;
  if public.record_site_metric(v_event,'page_view','/',v_key) then raise exception 'Replay accepted'; end if;
  select coalesce(sum(event_count),0) into v_after from public.site_metrics_daily where metric_day=v_day and event_name='page_view' and page_path='/';
  if v_after<>v_before+1 then raise exception 'Event aggregate or dedupe failed'; end if;
  insert into public.site_metric_limits(bucket,period_start,hits) values ('minute:'||v_key,date_trunc('minute',now()),120) on conflict(bucket,period_start) do update set hits=120;
  if public.record_site_metric(gen_random_uuid(),'page_view','/',v_key) then raise exception 'Minute limit bypassed'; end if;
  insert into public.site_metric_limits(bucket,period_start,hits) values ('day:'||v_key,v_day_start,1000) on conflict(bucket,period_start) do update set hits=1000;
  if public.record_site_metric(gen_random_uuid(),'page_view','/',v_key) then raise exception 'Day limit bypassed'; end if;
  update public.site_metric_limits set hits=20000 where bucket='global' and period_start=v_day_start;
  if public.record_site_metric(gen_random_uuid(),'page_view','/',repeat('e',64)) then raise exception 'Global limit bypassed'; end if;
  insert into public.site_metrics_daily(metric_day,event_name,page_path,event_count) values(v_day-100,'page_view','/',1) on conflict do nothing;
  insert into public.site_metric_dedupe(event_id,received_at) values(gen_random_uuid(),now()-interval '100 hours');
  insert into public.site_metric_limits(bucket,period_start,hits) values('fixture-old',now()-interval '100 hours',1);
  perform public.purge_site_metrics();
  if exists(select 1 from public.site_metrics_daily where metric_day < v_day-89)
    or exists(select 1 from public.site_metric_dedupe where received_at < now()-interval '48 hours')
    or exists(select 1 from public.site_metric_limits where period_start < now()-interval '48 hours') then raise exception 'Retention cleanup failed'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub',v_owner::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_owner,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  v_summary := public.site_metrics_summary(30);
  if (v_summary->>'page_views')::bigint < 1 then raise exception 'Owner cannot read summary'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',v_visitor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_visitor,'role','authenticated','user_metadata',jsonb_build_object('role','admin'))::text,true);
  execute 'set local role authenticated';
  select count(*) into v_after from public.site_metrics_daily;
  if v_after<>0 then raise exception 'Visitor can read metrics'; end if;
  begin
    perform public.site_metrics_summary(30);
    raise exception 'Visitor can call owner report';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
end;
$$;
select 'PASS: metrics ingestion, dedupe, quotas, retention and owner-only reports' as measurement_verification;
rollback;
