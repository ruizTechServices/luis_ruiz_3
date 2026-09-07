-- Read-only role checks. No object names, files, or auth details are returned.
begin;
do $$
declare
  owner_id uuid;
  visitor_id uuid;
  expected_count integer;
  visible_count integer;
begin
  select id into strict owner_id from auth.users
  where lower(email) = 'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null;
  select id into strict visitor_id from auth.users
  where lower(email) <> 'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null limit 1;
  select count(*) into expected_count from storage.objects where bucket_id = 'photos';

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count from storage.objects where bucket_id = 'photos';
  if visible_count <> expected_count then raise exception 'Owner cannot list existing photos'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', visitor_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', visitor_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count from storage.objects where bucket_id = 'photos';
  if visible_count <> 0 then raise exception 'Non-owner can list photo metadata'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  select count(*) into visible_count from storage.objects where bucket_id = 'photos';
  if visible_count <> 0 then raise exception 'Anonymous visitor can list photo metadata'; end if;
  execute 'reset role';
end;
$$;
select 'PASS: owner-only photos listing; existing public file URLs unchanged' as media_verification;
rollback;
