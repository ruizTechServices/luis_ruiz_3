-- Transaction-only queue and role tests: no provider calls, no emails, no
-- lasting records. Use after the inquiry notification migration is applied.
begin;
do $$
declare
  owner_id uuid;
  visitor_id uuid;
  expected_count integer;
  visible_count integer;
  test_id uuid;
  worker_lease uuid;
  frozen_payload jsonb;
  new_payload jsonb;
  claimed_count integer;
  accepted boolean;
begin
  select id into strict owner_id from auth.users where lower(email) = 'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null;
  select id into strict visitor_id from auth.users where lower(email) <> 'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null limit 1;
  insert into public.inquiry_notifications(kind) values ('test') returning id into test_id;
  select count(*) into expected_count from public.inquiry_notifications;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count from public.inquiry_notifications;
  if visible_count <> expected_count then raise exception 'Owner cannot read alerts'; end if;
  if has_function_privilege('authenticated', 'public.claim_inquiry_alerts(text,text,uuid)', 'execute') then raise exception 'Owner JWT can bypass worker'; end if;
  if has_table_privilege('authenticated','public.inquiry_notifications','insert') then raise exception 'Browser can enqueue arbitrary alerts'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', visitor_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', visitor_id, 'role', 'authenticated', 'user_metadata', jsonb_build_object('email','giosterr44@gmail.com','role','admin'))::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count from public.inquiry_notifications;
  if visible_count <> 0 then raise exception 'Visitor can read alerts'; end if;
  execute 'reset role';
  if has_table_privilege('anon','public.inquiry_notifications','select') then raise exception 'Anonymous can read queue'; end if;
  if has_function_privilege('anon','public.verify_inquiry_alert_cron(text)','execute') or has_function_privilege('authenticated','public.verify_inquiry_alert_cron(text)','execute') then raise exception 'Public cron credential oracle'; end if;

  execute 'set local role service_role';
  select lease_token, provider_payload into strict worker_lease, frozen_payload from public.claim_inquiry_alerts('Owner <alerts@example.com>', 'giosterr44@gmail.com', test_id);
  select count(*) into claimed_count from public.claim_inquiry_alerts('Other <alerts2@example.com>', 'giosterr44@gmail.com', test_id);
  if claimed_count <> 0 then raise exception 'Active lease claimed twice'; end if;
  select public.finish_inquiry_alert(test_id, gen_random_uuid(), true, 'wrong-lease', null, false) into accepted;
  if accepted then raise exception 'Wrong lease can finalize alert'; end if;
  select public.finish_inquiry_alert(test_id, worker_lease, false, null, 'provider_unknown_result', true) into accepted;
  if not accepted then raise exception 'Retryable failure not stored'; end if;
  select count(*) into claimed_count from public.claim_inquiry_alerts('Other <alerts2@example.com>', 'giosterr44@gmail.com', test_id);
  if claimed_count <> 0 then raise exception 'Retry ignored backoff'; end if;
  update public.inquiry_notifications set next_attempt_at = now() - interval '1 second' where id = test_id;
  select lease_token, provider_payload into strict worker_lease, new_payload from public.claim_inquiry_alerts('Changed <alerts3@example.com>', 'giosterr44@gmail.com', test_id);
  if frozen_payload is distinct from new_payload then raise exception 'Retry payload changed'; end if;
  select public.finish_inquiry_alert(test_id, worker_lease, true, 'accepted-test', null, false) into accepted;
  if not accepted then raise exception 'Provider acceptance not stored'; end if;
  select count(*) into claimed_count from public.claim_inquiry_alerts('Owner <alerts@example.com>', 'giosterr44@gmail.com', test_id);
  if claimed_count <> 0 then raise exception 'Accepted alert was claimed again'; end if;

  insert into public.inquiry_notifications(kind, first_attempt_at) values ('test', now() - interval '24 hours') returning id into test_id;
  select count(*) into claimed_count from public.claim_inquiry_alerts('Owner <alerts@example.com>', 'giosterr44@gmail.com', test_id);
  if claimed_count <> 0 or (select state from public.inquiry_notifications where id = test_id) <> 'needs_review' then raise exception 'Old ambiguous alert retried outside idempotency window'; end if;
  update public.inquiry_alert_configuration set last_test_at = null where singleton;
  if public.queue_inquiry_alert_test() is null or public.queue_inquiry_alert_test() is not null then raise exception 'Test alert throttle failed'; end if;
  if public.verify_inquiry_alert_cron(repeat('0',64)) then raise exception 'Wrong cron credential accepted'; end if;
  execute 'reset role';
end;
$$;
select 'PASS: owner privacy, service-only queue mutations, leases, safe retries, idempotency deadline, test throttle' as inquiry_alert_verification;
rollback;
