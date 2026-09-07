select cron.unschedule(jobid) from cron.job where jobname = 'luis-inquiry-alerts';
drop function if exists luis_ruiz_private.invoke_inquiry_alert_worker();
drop function if exists public.verify_inquiry_alert_cron(text);
drop function if exists luis_ruiz_private.verify_inquiry_alert_cron(text);
drop function if exists public.inquiry_alert_status();
drop function if exists public.finish_inquiry_alert(uuid,uuid,boolean,text,text,boolean);
drop function if exists public.claim_inquiry_alerts(text,text,uuid);
drop function if exists public.queue_inquiry_alert_test();
drop function if exists public.hold_unconfigured_inquiry_alerts();
drop function if exists public.record_inquiry_alert_configuration(boolean,boolean);
drop function if exists public.inquiry_alert_recipient();
drop function if exists luis_ruiz_private.inquiry_alert_recipient();
drop table if exists public.inquiry_alert_configuration;
drop table if exists public.inquiry_notifications;
delete from vault.secrets where name = 'luis_inquiry_alert_cron_token';
-- Preserve shared pg_cron/pg_net/Vault extensions and private schema.
