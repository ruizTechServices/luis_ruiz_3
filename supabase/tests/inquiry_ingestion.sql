-- Run after ingestion AND contactlist lockdown migrations. No external calls or
-- emails. Synthetic inquiries and notification queue rows are rolled back.
begin;
do $$
declare
  owner_id uuid;
  v_request_id uuid := gen_random_uuid();
  run_key text := md5(gen_random_uuid()::text);
  network_key text;
  email_key text;
  fingerprint text;
  payload jsonb := jsonb_build_object('full_name','Ingestion verification','email','ingestion-test@example.invalid','subject','Build a website or app','message','Synthetic inquiry used only inside a rolled back test.','budget','','timeline','','source_path','/projects/gios-soundboard');
  result jsonb;
  inquiry_id bigint;
  baseline_rows bigint;
  baseline_queue bigint;
  baseline_hits bigint;
  global_key text := 'global-hour-' || to_char(clock_timestamp() at time zone 'UTC','YYYYMMDDHH24');
  day_text text := to_char(clock_timestamp() at time zone 'UTC','YYYYMMDD');
  step integer;
  bad jsonb;
begin
  payload := payload || jsonb_build_object('full_name','Verification ' || run_key);
  select id into strict owner_id from auth.users where lower(email)='giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null;
  network_key := md5(run_key || 'network') || md5(run_key || 'network2');
  email_key := md5(run_key || 'email') || md5(run_key || 'email2');
  fingerprint := md5(run_key || 'body') || md5(run_key || 'body2');
  if has_any_column_privilege('anon','public.contactlist','insert') or has_any_column_privilege('authenticated','public.contactlist','insert') then raise exception 'Browser roles can bypass ingestion with direct inserts'; end if;
  if has_function_privilege('anon','public.accept_site_inquiry(uuid,jsonb,text,text,text)','execute') or has_function_privilege('authenticated','public.accept_site_inquiry(uuid,jsonb,text,text,text)','execute') then raise exception 'Browser roles can call trusted ingestion RPC'; end if;
  if has_table_privilege('anon','luis_ruiz_private.inquiry_requests','select') or has_table_privilege('authenticated','luis_ruiz_private.inquiry_limits','select') then raise exception 'Private request/rate metadata exposed'; end if;

  execute 'set local role anon';
  begin
    perform public.accept_site_inquiry(v_request_id,payload,network_key,email_key,fingerprint);
    raise exception 'Anonymous ingestion RPC succeeded';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.accept_site_inquiry(v_request_id,payload,network_key,email_key,fingerprint);
    raise exception 'Owner browser bypassed trusted ingestion';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  execute 'set local role service_role';
  -- Isolate the global window from prior real traffic; rollback restores it.
  insert into luis_ruiz_private.inquiry_limits(key,hits) values(global_key,1) on conflict(key) do update set hits=1;
  select count(*) into baseline_rows from public.contactlist where full_name='Verification ' || run_key;
  select count(*) into baseline_queue from public.inquiry_notifications n join public.contactlist c on c.id=n.inquiry_id where c.full_name='Verification ' || run_key;
  result := public.accept_site_inquiry(v_request_id,payload,network_key,email_key,fingerprint);
  if result->>'status' <> 'accepted' then raise exception 'Valid inquiry not accepted'; end if;
  if (select count(*) from public.contactlist where full_name='Verification ' || run_key) <> baseline_rows+1 or (select count(*) from public.inquiry_notifications n join public.contactlist c on c.id=n.inquiry_id where c.full_name='Verification ' || run_key) <> baseline_queue+1 then raise exception 'Acceptance did not create exactly one inquiry and alert'; end if;
  select r.inquiry_id into strict inquiry_id from luis_ruiz_private.inquiry_requests r where r.request_id=v_request_id;
  if not exists(select 1 from public.contactlist c where c.id=inquiry_id and c.status='new' and c.source_path='/projects/gios-soundboard' and c.source_project='gios-soundboard' and c.user_id is null and c.newsletter=false) then raise exception 'Inquiry defaults or project attribution are wrong'; end if;
  select sum(hits) into baseline_hits from luis_ruiz_private.inquiry_limits;
  if public.accept_site_inquiry(v_request_id,payload,network_key,email_key,fingerprint)->>'status' <> 'duplicate' then raise exception 'Same request retry not deduplicated'; end if;
  if public.accept_site_inquiry(gen_random_uuid(),payload,network_key,email_key,fingerprint)->>'status' <> 'duplicate' then raise exception 'Identical payload retry not deduplicated'; end if;
  if public.accept_site_inquiry(v_request_id,payload,network_key,email_key,repeat('f',64))->>'status' <> 'conflict' then raise exception 'Request ID reused with changed content did not conflict'; end if;
  if (select count(*) from public.contactlist where full_name='Verification ' || run_key) <> baseline_rows+1 or (select count(*) from public.inquiry_notifications n join public.contactlist c on c.id=n.inquiry_id where c.full_name='Verification ' || run_key) <> baseline_queue+1 or (select sum(hits) from luis_ruiz_private.inquiry_limits) <> baseline_hits then raise exception 'Duplicate/conflict consumed limits or created records'; end if;

  for bad in select value from jsonb_array_elements(jsonb_build_array(
    payload || jsonb_build_object('email','invalid'),
    payload || jsonb_build_object('message','short'),
    payload || jsonb_build_object('subject','arbitrary'),
    payload || jsonb_build_object('full_name',repeat('x',121)),
    payload || jsonb_build_object('budget',repeat('x',121)),
    payload || jsonb_build_object('message',repeat('x',5001))
  )) loop
    begin
      perform public.accept_site_inquiry(gen_random_uuid(),bad,network_key,email_key,fingerprint);
      raise exception 'Invalid payload accepted';
    exception when raise_exception then if sqlerrm not like 'Invalid inquiry%' then raise; end if; end;
  end loop;
  begin
    perform public.accept_site_inquiry(gen_random_uuid(),payload,'not-a-hash',email_key,fingerprint);
    raise exception 'Invalid rate metadata accepted';
  exception when raise_exception then if sqlerrm <> 'Invalid inquiry metadata' then raise; end if; end;

  -- Same email is limited to three distinct accepted notes per day, even when
  -- network hashes differ. Unique fingerprints exercise insertion each time.
  select count(*) into baseline_rows from public.contactlist where full_name='Verification ' || run_key;
  email_key := md5(run_key || 'email-limit') || md5(run_key || 'email-limit2');
  for step in 1..4 loop
    network_key := md5(run_key || 'email-network' || step) || md5(run_key || 'email-network2' || step);
    fingerprint := md5(run_key || 'email-body' || step) || md5(run_key || 'email-body2' || step);
    result := public.accept_site_inquiry(gen_random_uuid(),payload || jsonb_build_object('message','Unique email threshold verification ' || step),network_key,email_key,fingerprint);
    if result->>'status' <> (case when step<=3 then 'accepted' else 'rate_limited' end) then raise exception 'Email daily limit failed at %',step; end if;
  end loop;
  if (select count(*) from public.contactlist where full_name='Verification ' || run_key) <> baseline_rows+3 then raise exception 'Rate-limited email was inserted'; end if;

  select count(*) into baseline_rows from public.contactlist where full_name='Verification ' || run_key;
  network_key := md5(run_key || 'network-limit') || md5(run_key || 'network-limit2');
  for step in 1..6 loop
    email_key := md5(run_key || 'network-email' || step) || md5(run_key || 'network-email2' || step);
    fingerprint := md5(run_key || 'network-body' || step) || md5(run_key || 'network-body2' || step);
    result := public.accept_site_inquiry(gen_random_uuid(),payload || jsonb_build_object('message','Unique network threshold verification ' || step),network_key,email_key,fingerprint);
    if result->>'status' <> (case when step<=5 then 'accepted' else 'rate_limited' end) then raise exception 'Network hourly limit failed at %',step; end if;
  end loop;
  if (select count(*) from public.contactlist where full_name='Verification ' || run_key) <> baseline_rows+5 then raise exception 'Rate-limited network was inserted'; end if;

  network_key := md5(run_key || 'day-limit') || md5(run_key || 'day-limit2');
  email_key := md5(run_key || 'day-email') || md5(run_key || 'day-email2');
  fingerprint := md5(run_key || 'day-body') || md5(run_key || 'day-body2');
  insert into luis_ruiz_private.inquiry_limits(key,hits) values('network-day-'||day_text||'-'||network_key,15);
  if public.accept_site_inquiry(gen_random_uuid(),payload,network_key,email_key,fingerprint)->>'status' <> 'rate_limited' then raise exception 'Network daily threshold bypassed'; end if;
  update luis_ruiz_private.inquiry_limits set hits=100 where key=global_key;
  if public.accept_site_inquiry(gen_random_uuid(),payload,network_key,email_key,fingerprint)->>'status' <> 'rate_limited' then raise exception 'Global hourly threshold bypassed'; end if;
  update luis_ruiz_private.inquiry_limits set hits=1 where key=global_key;

  network_key := md5(run_key || 'source-network') || md5(run_key || 'source-network2');
  email_key := md5(run_key || 'source-email') || md5(run_key || 'source-email2');
  fingerprint := md5(run_key || 'source-body') || md5(run_key || 'source-body2');
  v_request_id := gen_random_uuid();
  result := public.accept_site_inquiry(v_request_id,payload || jsonb_build_object('source_path','/dashboard?private=yes'),network_key,email_key,fingerprint);
  if result->>'status' <> 'accepted' then raise exception 'Invalid attribution blocked valid inquiry'; end if;
  if exists(select 1 from public.contactlist c join luis_ruiz_private.inquiry_requests r on r.inquiry_id=c.id where r.request_id=v_request_id and (c.source_path is not null or c.source_project is not null)) then raise exception 'Private attribution survived validation'; end if;
  execute 'reset role';
end;
$$;
select 'PASS: service-only ingestion, direct-write lockdown, retry idempotency, one alert per inquiry, payload validation, email/network/global limits and public-only attribution' as inquiry_ingestion_verification;
rollback;
