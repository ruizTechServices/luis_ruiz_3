-- Durable, owner-only notification queue. No existing inquiries are backfilled.
create extension if not exists pg_net with schema extensions;

create table public.inquiry_notifications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id bigint unique references public.contactlist(id) on delete cascade,
  kind text not null default 'inquiry' check (kind in ('inquiry','test')),
  state text not null default 'pending' check (state in ('pending','processing','not_configured','sent','failed','needs_review')),
  attempts integer not null default 0 check (attempts between 0 and 6),
  created_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz default now(),
  lease_until timestamptz,
  lease_token uuid,
  provider_payload jsonb,
  provider_id text,
  accepted_at timestamptz,
  last_error_code text,
  check ((kind = 'inquiry' and inquiry_id is not null) or (kind = 'test' and inquiry_id is null))
);
create index inquiry_notifications_due on public.inquiry_notifications(next_attempt_at) where state in ('pending','not_configured','failed','processing');
alter table public.inquiry_notifications enable row level security;
revoke all on public.inquiry_notifications from public, anon, authenticated;
grant select on public.inquiry_notifications to authenticated;
grant all on public.inquiry_notifications to service_role;
create policy inquiry_notifications_owner_read on public.inquiry_notifications for select to authenticated using ((select public.is_gio_admin()));

create table public.inquiry_alert_configuration (
  singleton boolean primary key default true check (singleton),
  configured boolean not null default false,
  checked_at timestamptz,
  worker_checked_at timestamptz,
  last_test_at timestamptz
);
insert into public.inquiry_alert_configuration(singleton) values (true);
alter table public.inquiry_alert_configuration enable row level security;
revoke all on public.inquiry_alert_configuration from public, anon, authenticated;
grant select on public.inquiry_alert_configuration to authenticated;
grant all on public.inquiry_alert_configuration to service_role;
create policy inquiry_alert_configuration_owner_read on public.inquiry_alert_configuration for select to authenticated using ((select public.is_gio_admin()));

-- Exact, verified owner recipient. The fixed private lookup is required because
-- service_role cannot SELECT auth.users through the public Data API.
create function luis_ruiz_private.inquiry_alert_recipient()
returns text language sql stable security definer set search_path = '' as $$
  select email::text from auth.users
  where lower(email) = 'giosterr44@gmail.com' and email_confirmed_at is not null
    and deleted_at is null and (banned_until is null or banned_until < now())
  order by created_at limit 1;
$$;
revoke all on function luis_ruiz_private.inquiry_alert_recipient() from public, anon, authenticated;
grant usage on schema luis_ruiz_private to service_role;
grant execute on function luis_ruiz_private.inquiry_alert_recipient() to service_role;
create function public.inquiry_alert_recipient() returns text
language sql stable security invoker set search_path = '' as $$ select luis_ruiz_private.inquiry_alert_recipient(); $$;

create function public.record_inquiry_alert_configuration(p_configured boolean, p_worker_tick boolean default false)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.inquiry_alert_configuration set configured = p_configured, checked_at = now(),
    worker_checked_at = case when p_worker_tick then now() else worker_checked_at end where singleton;
  return true;
end;
$$;

create function public.hold_unconfigured_inquiry_alerts()
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.inquiry_notifications set state = 'not_configured', last_error_code = 'not_configured'
  where state in ('pending','not_configured') or (state = 'failed' and next_attempt_at is not null);
  return true;
end;
$$;

create function public.queue_inquiry_alert_test()
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  update public.inquiry_alert_configuration set last_test_at = now()
    where singleton and (last_test_at is null or last_test_at <= now() - interval '1 minute');
  if not found then return null; end if;
  insert into public.inquiry_notifications(kind) values ('test') returning id into v_id;
  return v_id;
end;
$$;

create function public.claim_inquiry_alerts(p_from text, p_recipient text, p_test_id uuid default null)
returns table(id uuid, lease_token uuid, provider_payload jsonb)
language plpgsql security invoker set search_path = '' as $$
begin
  if p_from is null or p_recipient is null or length(p_from) not between 3 and 320 or p_from ~ E'[\r\n]' or p_recipient is distinct from public.inquiry_alert_recipient() then
    raise exception 'invalid_alert_configuration';
  end if;
  -- Resend deduplicates only for 24h. Stop automatic retries after 23h rather
  -- than risk sending twice after an unrecorded provider success.
  update public.inquiry_notifications n set state = 'needs_review', next_attempt_at = null,
    lease_until = null, lease_token = null,
    last_error_code = case when n.attempts >= 6 then 'attempt_limit' else 'idempotency_window' end
  where n.state <> 'sent' and n.state <> 'needs_review'
    and (n.lease_until is null or n.lease_until < now())
    and (n.attempts >= 6 or n.first_attempt_at < now() - interval '23 hours');

  return query
  with due as (
    select n.id from public.inquiry_notifications n
    where (p_test_id is null or n.id = p_test_id)
      and ((n.state in ('pending','not_configured','failed') and n.next_attempt_at <= now())
        or (n.state = 'processing' and n.lease_until < now()))
      and n.attempts < 6
      and (n.first_attempt_at is null or n.first_attempt_at > now() - interval '23 hours')
    order by n.created_at, n.id limit 3 for update skip locked
  )
  update public.inquiry_notifications n
  set state = 'processing', attempts = n.attempts + 1,
    first_attempt_at = coalesce(n.first_attempt_at, now()), last_attempt_at = now(),
    lease_until = now() + interval '2 minutes', lease_token = gen_random_uuid(),
    provider_payload = coalesce(n.provider_payload, jsonb_build_object(
      'from', p_from, 'to', jsonb_build_array(p_recipient),
      'subject', case when n.kind = 'test' then 'Your inquiry alerts test' else 'New project inquiry on luis-ruiz.com' end,
      'text', case when n.kind = 'test' then E'This is the test alert you requested from your website.\n\nOpen your private inbox: https://www.luis-ruiz.com/dashboard/inquiries\n\nNo client information is included in email alerts.'
        else E'A new project inquiry is ready in your private inbox.\n\nhttps://www.luis-ruiz.com/dashboard/inquiries?id=' || n.inquiry_id::text || E'\n\nSign in to read it and plan your follow-up. No client information is included in this email.' end
    ))
  from due where n.id = due.id
  returning n.id, n.lease_token, n.provider_payload;
end;
$$;

create function public.finish_inquiry_alert(p_id uuid, p_lease_token uuid, p_accepted boolean, p_provider_id text, p_error_code text, p_retryable boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_accepted and (p_provider_id is null or length(p_provider_id) not between 1 and 128) then raise exception 'invalid_provider_id'; end if;
  if not p_accepted and p_error_code not in ('payload_conflict','provider_rate_limit','provider_retryable','provider_unknown_result','provider_credentials','provider_rejected') then raise exception 'invalid_error_code'; end if;
  update public.inquiry_notifications n set
    state = case when p_accepted then 'sent' when p_error_code = 'payload_conflict' or n.attempts >= 6 then 'needs_review' else 'failed' end,
    provider_id = case when p_accepted then p_provider_id else null end,
    accepted_at = case when p_accepted then now() else null end,
    last_error_code = case when p_accepted then null else p_error_code end,
    next_attempt_at = case when not p_accepted and p_retryable and n.attempts < 6 then now() + make_interval(secs => (60 * power(2, n.attempts - 1))::integer) else null end,
    lease_until = null, lease_token = null
  where n.id = p_id and n.lease_token = p_lease_token and n.state = 'processing';
  return found;
end;
$$;

create function public.inquiry_alert_status()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'configured', c.configured, 'checkedAt', c.checked_at, 'workerCheckedAt', c.worker_checked_at,
    'pending', (select count(*) from public.inquiry_notifications where state in ('pending','processing','not_configured') or (state = 'failed' and next_attempt_at is not null)),
    'accepted', (select count(*) from public.inquiry_notifications where state = 'sent'),
    'attention', (select count(*) from public.inquiry_notifications where state = 'needs_review' or (state = 'failed' and next_attempt_at is null)),
    'recent', coalesce((select jsonb_agg(row_to_json(r)) from (
      select inquiry_id, kind, state, attempts, last_error_code, accepted_at, next_attempt_at
      from public.inquiry_notifications order by created_at desc limit 5
    ) r), '[]'::jsonb)
  ) from public.inquiry_alert_configuration c where c.singleton;
$$;

-- The random cron credential is created and used only in the database. It is
-- never returned by any API or checked into source.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'luis_inquiry_alert_cron_token') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'luis_inquiry_alert_cron_token', 'Private cron invocation credential for site-inquiry-alerts');
  end if;
end $$;

create function luis_ruiz_private.verify_inquiry_alert_cron(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(length(p_token) = 64 and extensions.digest(p_token, 'sha256') = extensions.digest(
    (select decrypted_secret from vault.decrypted_secrets where name = 'luis_inquiry_alert_cron_token' limit 1), 'sha256'), false);
$$;
revoke all on function luis_ruiz_private.verify_inquiry_alert_cron(text) from public, anon, authenticated;
grant execute on function luis_ruiz_private.verify_inquiry_alert_cron(text) to service_role;
create function public.verify_inquiry_alert_cron(p_token text) returns boolean language sql stable security invoker set search_path = '' as $$
  select luis_ruiz_private.verify_inquiry_alert_cron(p_token);
$$;

create function luis_ruiz_private.invoke_inquiry_alert_worker()
returns bigint language sql security invoker set search_path = '' as $$
  select net.http_post(
    url := 'https://huyhgdsjpdjzokjwaspb.supabase.co/functions/v1/site-inquiry-alerts',
    headers := jsonb_build_object('Content-Type','application/json','x-inquiry-cron-token',
      (select decrypted_secret from vault.decrypted_secrets where name = 'luis_inquiry_alert_cron_token' limit 1)),
    body := '{"action":"process"}'::jsonb,
    timeout_milliseconds := 55000
  );
$$;
revoke all on function luis_ruiz_private.invoke_inquiry_alert_worker() from public, anon, authenticated, service_role;

-- Revoke default PUBLIC function execution. All mutations, transport secrets,
-- and recipient lookup are service_role only; owner access goes through worker.
revoke all on function public.inquiry_alert_recipient() from public, anon, authenticated;
revoke all on function public.record_inquiry_alert_configuration(boolean, boolean) from public, anon, authenticated;
revoke all on function public.hold_unconfigured_inquiry_alerts() from public, anon, authenticated;
revoke all on function public.queue_inquiry_alert_test() from public, anon, authenticated;
revoke all on function public.claim_inquiry_alerts(text,text,uuid) from public, anon, authenticated;
revoke all on function public.finish_inquiry_alert(uuid,uuid,boolean,text,text,boolean) from public, anon, authenticated;
revoke all on function public.inquiry_alert_status() from public, anon, authenticated;
revoke all on function public.verify_inquiry_alert_cron(text) from public, anon, authenticated;
grant execute on function public.inquiry_alert_recipient(), public.record_inquiry_alert_configuration(boolean,boolean),
  public.hold_unconfigured_inquiry_alerts(), public.queue_inquiry_alert_test(), public.claim_inquiry_alerts(text,text,uuid),
  public.finish_inquiry_alert(uuid,uuid,boolean,text,text,boolean), public.inquiry_alert_status(), public.verify_inquiry_alert_cron(text) to service_role;

select cron.schedule('luis-inquiry-alerts', '* * * * *', 'select luis_ruiz_private.invoke_inquiry_alert_worker()');
