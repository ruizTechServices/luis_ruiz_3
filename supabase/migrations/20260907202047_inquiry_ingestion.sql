create or replace function public.accept_site_inquiry(p_request_id uuid, p_payload jsonb, p_network_key text, p_email_key text, p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_previous luis_ruiz_private.inquiry_requests%rowtype;
  v_id bigint;
  v_key text;
  v_limit integer;
  v_hits integer;
  v_hour text := to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDDHH24');
  v_day text := to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDD');
  v_source text := p_payload->>'source_path';
begin
  if p_request_id is null or p_fingerprint !~ '^[0-9a-f]{64}$' or p_network_key !~ '^[0-9a-f]{64}$' or p_email_key !~ '^[0-9a-f]{64}$'
    or p_fingerprint is null or p_network_key is null or p_email_key is null then raise exception 'Invalid inquiry metadata'; end if;
  if jsonb_typeof(p_payload) <> 'object'
    or coalesce(char_length(trim(p_payload->>'full_name')),0) not between 1 and 120
    or coalesce(char_length(p_payload->>'email'),0) not between 3 and 254
    or coalesce(p_payload->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or coalesce(char_length(trim(p_payload->>'message')),0) not between 10 and 5000
    or coalesce(char_length(p_payload->>'budget'),0) > 120
    or coalesce(char_length(p_payload->>'timeline'),0) > 120
    or coalesce(p_payload->>'subject','') not in ('Build a website or app','Fix or improve a website','AI integration or automation','Freelance or work opportunity','Not sure yet')
    then raise exception 'Invalid inquiry'; end if;
  if v_source is not null and not (v_source in ('/','/about','/projects','/blog','/soundboard','/contact','/sitemap') or v_source ~ '^/projects/[a-z0-9][a-z0-9-]{0,99}$' or v_source ~ '^/blog/[1-9][0-9]{0,12}$') then v_source := null; end if;
  if char_length(v_source)>112 then v_source := null; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_fingerprint,1));
  select * into v_previous from luis_ruiz_private.inquiry_requests where request_id=p_request_id;
  if found then return jsonb_build_object('status', case when v_previous.fingerprint=p_fingerprint then 'duplicate' else 'conflict' end); end if;
  if exists(select 1 from luis_ruiz_private.inquiry_requests where fingerprint=p_fingerprint and received_at>now()-interval '24 hours') then
    return jsonb_build_object('status','duplicate');
  end if;
  -- Charge sender buckets first: rejected abusive attempts cannot exhaust the site-wide cap.
  -- Fixed windows and atomic UPSERTs work across concurrent edge instances.
  for v_key,v_limit in select key,maximum from (values
    (1,'network-hour-'||v_hour||'-'||p_network_key,5),
    (2,'network-day-'||v_day||'-'||p_network_key,15),
    (3,'email-day-'||v_day||'-'||p_email_key,3),
    (4,'global-hour-'||v_hour,100)
  ) as limits(priority,key,maximum) order by priority loop
    insert into luis_ruiz_private.inquiry_limits(key,hits) values(v_key,1)
    on conflict(key) do update set hits=least(luis_ruiz_private.inquiry_limits.hits+1,100000)
    returning hits into v_hits;
    if v_hits>v_limit then return jsonb_build_object('status','rate_limited'); end if;
  end loop;
  delete from luis_ruiz_private.inquiry_limits where window_start<now()-interval '2 days';
  delete from luis_ruiz_private.inquiry_requests where received_at<now()-interval '2 days';
  insert into public.contactlist(full_name,email,subject,message,budget,timeline,preferred_contact,newsletter,user_id,source_path,source_project)
  values(trim(p_payload->>'full_name'),lower(trim(p_payload->>'email')),p_payload->>'subject',trim(p_payload->>'message'),nullif(trim(p_payload->>'budget'),''),nullif(trim(p_payload->>'timeline'),''),'email',false,null,v_source,case when v_source like '/projects/%' then substr(v_source,11) else null end)
  returning id into v_id;
  insert into luis_ruiz_private.inquiry_requests(request_id,fingerprint,inquiry_id) values(p_request_id,p_fingerprint,v_id);
  insert into public.inquiry_notifications(inquiry_id) values(v_id) on conflict(inquiry_id) do nothing;
  return jsonb_build_object('status','accepted');
end;
$$;
revoke all on function public.accept_site_inquiry(uuid,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.accept_site_inquiry(uuid,jsonb,text,text,text) to service_role;
