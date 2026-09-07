-- Conservative rollback. Disable the deployed metric collector before running.
-- If any metrics or security records exist, this deliberately refuses to run.
-- Export/review retained data and perform a separately authorized manual cleanup
-- before retrying; this script never deletes data to make its own guard pass.
begin;
do $$
declare
  v_table text;
  v_has_rows boolean;
begin
  foreach v_table in array array['site_metrics_daily','site_metric_dedupe','site_metric_limits'] loop
    if to_regclass('public.' || v_table) is not null then
      execute format('select exists(select 1 from public.%I limit 1)', v_table) into v_has_rows;
      if v_has_rows then
        raise exception 'Refusing rollback: public.% contains data. Export/review it and explicitly authorize manual cleanup before retrying.', v_table;
      end if;
    end if;
  end loop;
  if to_regclass('cron.job') is not null then
    perform cron.unschedule(jobid) from cron.job where jobname = 'luis-site-metrics-retention';
  end if;
end;
$$;

drop function if exists public.site_metrics_summary(integer);
drop function if exists public.record_site_metric(uuid,text,text,text);
drop function if exists public.purge_site_metrics();
drop table if exists public.site_metric_dedupe;
drop table if exists public.site_metric_limits;
drop table if exists public.site_metrics_daily;
commit;
