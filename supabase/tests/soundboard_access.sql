-- Rollback-only role verification. Uses the existing confirmed owner identity.
begin;
select set_config('test.soundboard_owner', (select id::text from auth.users where lower(email) = 'giosterr44@gmail.com' and email_confirmed_at is not null and deleted_at is null limit 1), true);
delete from public.soundboard_upload_windows where user_id = current_setting('test.soundboard_owner')::uuid;
insert into public.soundboard_clips (id,label,source_path,category,duration_seconds)
values ('sound-00000000-0000-4000-8000-000000000091', 'Rollback verification sound', 'clips/00000000-0000-4000-8000-000000000091.wav', 'Effects', 1);

set local role anon;
do $$ begin
  if exists (select 1 from public.soundboard_clips where id = 'sound-00000000-0000-4000-8000-000000000091') then raise exception 'Draft exposed'; end if;
  begin perform public.reserve_soundboard_upload(); raise exception 'Anonymous quota RPC exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-000000000099', 'role', 'authenticated', 'user_metadata', json_build_object('role', 'admin'))::text, true);
set local role authenticated;
do $$ begin
  if exists (select 1 from public.soundboard_clips where id = 'sound-00000000-0000-4000-8000-000000000091') then raise exception 'Visitor sees draft'; end if;
  if public.reserve_soundboard_upload() then raise exception 'Visitor received upload quota'; end if;
  begin
    insert into public.soundboard_clips (id,label,source_path,category,duration_seconds) values ('sound-00000000-0000-4000-8000-000000000092', 'Should fail', 'clips/00000000-0000-4000-8000-000000000092.wav', 'Effects', 1);
    raise exception 'Visitor inserted clip';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.soundboard_owner'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  if not exists (select 1 from public.soundboard_clips where id = 'sound-00000000-0000-4000-8000-000000000091') then raise exception 'Owner cannot see draft'; end if;
  for i in 1..10 loop if not public.reserve_soundboard_upload() then raise exception 'Owner upload quota unexpectedly denied'; end if; end loop;
  if public.reserve_soundboard_upload() then raise exception 'Upload quota bypassed'; end if;
  begin update public.soundboard_clips set source_path = '/sounds/nope.mp3' where id = 'vine-boom'; raise exception 'Original source writable'; exception when insufficient_privilege then null; end;
  update public.soundboard_clips set label = 'Verified rollback sound', status = 'published', daily_pick = false where id = 'sound-00000000-0000-4000-8000-000000000091';
end $$;
reset role;
set local role anon;
do $$ begin
  if not exists (select 1 from public.soundboard_clips where id = 'sound-00000000-0000-4000-8000-000000000091' and label = 'Verified rollback sound' and not daily_pick) then raise exception 'Publication failed'; end if;
end $$;
reset role;
set local role authenticated;
update public.soundboard_clips set status = 'archived' where id = 'sound-00000000-0000-4000-8000-000000000091';
reset role;
set local role anon;
do $$ begin
  if exists (select 1 from public.soundboard_clips where id = 'sound-00000000-0000-4000-8000-000000000091') then raise exception 'Archived clip exposed'; end if;
end $$;
reset role;
select 'PASS: owner management, publication, archive, original immutability and upload quota' as result;
rollback;
