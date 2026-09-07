-- Run after the publishing + owner-identity migrations with a migration-capable
-- SQL connection. Exercises RLS as actual roles, then rolls back every test row.
-- Identity sequences may advance; no content or auth account is left behind.
begin;

select set_config('test.owner_claims', json_build_object(
  'sub', id, 'email', email, 'role', 'authenticated'
)::text, true)
from auth.users
where lower(email) = 'giosterr44@gmail.com' and email_confirmed_at is not null;

select set_config('request.jwt.claims', current_setting('test.owner_claims'), true);
set local role authenticated;

do $$
declare test_id bigint; saved_at timestamptz;
begin
  if not public.is_gio_admin() then raise exception 'FAIL: existing owner cannot author'; end if;
  insert into public.blog_posts (title, body)
  values ('Publishing integration check — rolled back', 'Private verification content.')
  returning id, updated_at into test_id, saved_at;
  perform set_config('test.story_id', test_id::text, true);
  perform set_config('test.saved_at', saved_at::text, true);
  if not exists (select 1 from public.blog_posts where id=test_id and status='draft' and published_at is null) then
    raise exception 'FAIL: new stories are not private by default';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if exists (select 1 from public.blog_posts where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: anonymous table read exposes draft';
  end if;
  if exists (select 1 from public.get_blog_posts_with_stats() where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: anonymous RPC exposes draft';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","email":"not-owner@example.com","user_metadata":{"role":"admin"}}', true);
set local role authenticated;
do $$
declare affected integer;
begin
  if public.is_gio_admin() then raise exception 'FAIL: non-owner accepted as owner'; end if;
  if exists (select 1 from public.blog_posts where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: signed-in non-owner sees draft';
  end if;
  begin
    insert into public.blog_posts(title,body,status) values ('Denied writer','Denied body','draft');
    raise exception 'FAIL: non-owner created a story';
  exception when insufficient_privilege then null;
  end;
  update public.blog_posts set title='Denied modification' where id=current_setting('test.story_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: non-owner edited a story'; end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', current_setting('test.owner_claims'), true);
set local role authenticated;
do $$
declare affected integer;
begin
  update public.blog_posts set status='published' where id=current_setting('test.story_id')::bigint;
  if not exists (select 1 from public.blog_posts where id=current_setting('test.story_id')::bigint and status='published' and published_at is not null) then
    raise exception 'FAIL: owner cannot publish with publication timestamp';
  end if;
  update public.blog_posts set title='Stale overwrite'
  where id=current_setting('test.story_id')::bigint and updated_at=current_setting('test.saved_at')::timestamptz;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: stale edit overwrote newer story'; end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if not exists (select 1 from public.blog_posts where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: published story missing from public table read';
  end if;
  if not exists (select 1 from public.get_blog_posts_with_stats() where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: published story missing from public RPC';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', current_setting('test.owner_claims'), true);
set local role authenticated;
update public.blog_posts set status='draft' where id=current_setting('test.story_id')::bigint;
do $$
begin
  if exists (select 1 from public.get_blog_posts_with_stats() where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: public RPC includes owner draft when owner is signed in';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if exists (select 1 from public.blog_posts where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: unpublished story remains public';
  end if;
  if exists (select 1 from public.get_blog_posts_with_stats() where id=current_setting('test.story_id')::bigint) then
    raise exception 'FAIL: unpublished story remains in public RPC';
  end if;
end;
$$;

reset role;
select 'PASS: default draft, anonymous/non-owner privacy, owner publish/unpublish, RPC filtering, and stale-edit protection' as publishing_verification;
rollback;
