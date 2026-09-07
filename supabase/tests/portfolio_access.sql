-- Run as postgres after the portfolio identity/visibility/privacy migration.
-- All checks and synthetic projects are rolled back. No existing content,
-- auth records, passwords, tokens, or profile roles are changed or returned.
-- Explicit negative IDs avoid advancing the production project sequence.
begin;

do $$
declare
  owner_id uuid;
  visitor_id uuid;
  private_id bigint := -910001;
  unlisted_id bigint := -910002;
  visible_count integer;
begin
  select id into strict owner_id
  from auth.users
  where lower(email) = 'giosterr44@gmail.com'
    and email_confirmed_at is not null
    and deleted_at is null;

  select id into visitor_id
  from auth.users
  where lower(email) <> 'giosterr44@gmail.com'
    and email_confirmed_at is not null
    and deleted_at is null
  limit 1;

  if visitor_id is null then
    raise exception 'Access check requires an existing non-owner account';
  end if;

  if has_function_privilege('anon', 'public.is_gio_admin()', 'EXECUTE')
     or has_function_privilege('anon', 'luis_ruiz_private.is_verified_owner()', 'EXECUTE') then
    raise exception 'Anonymous callers must not execute owner identity helpers';
  end if;

  if has_column_privilege('anon', 'public.comments', 'user_email', 'SELECT')
     or has_column_privilege('authenticated', 'public.comments', 'user_email', 'SELECT') then
    raise exception 'Comment email remains readable through the public API';
  end if;

  if not has_column_privilege('anon', 'public.comments', 'content', 'SELECT')
     or not has_column_privilege('authenticated', 'public.comments', 'content', 'UPDATE') then
    raise exception 'Comment display or moderation grants were lost';
  end if;

  if has_column_privilege('authenticated', 'public.user_profiles', 'role', 'UPDATE')
     or has_column_privilege('authenticated', 'public.user_profiles', 'user_id', 'UPDATE')
     or has_table_privilege('authenticated', 'public.user_profiles', 'INSERT') then
    raise exception 'Profile ownership/role can be changed by an API caller';
  end if;

  insert into public.projects (id, title, slug, url, visibility)
  values
    (private_id, 'Security verification fixture', 'portfolio-access-private-fixture',
      'https://example.invalid/security-verification', 'private'),
    (unlisted_id, 'Security verification fixture', 'portfolio-access-unlisted-fixture',
      'https://example.invalid/security-verification', 'unlisted');

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  if public.is_gio_admin() is distinct from true then
    raise exception 'Verified owner cannot access the admin console';
  end if;
  select count(*) into visible_count from public.projects where id in (private_id, unlisted_id);
  if visible_count <> 2 then
    raise exception 'Verified owner cannot manage hidden projects';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', visitor_id::text, true);
  -- Deliberately misleading claims must not grant another identity admin rights.
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', visitor_id, 'role', 'authenticated', 'email', 'giosterr44@gmail.com',
    'user_metadata', jsonb_build_object('role', 'admin', 'email_verified', true)
  )::text, true);
  execute 'set local role authenticated';

  if public.is_gio_admin() is distinct from false then
    raise exception 'A non-owner received admin access';
  end if;
  select count(*) into visible_count from public.projects where id in (private_id, unlisted_id);
  if visible_count <> 0 then
    raise exception 'A signed-in visitor can read hidden projects';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  select count(*) into visible_count from public.projects where id in (private_id, unlisted_id);
  if visible_count <> 0 then
    raise exception 'An anonymous visitor can read hidden projects';
  end if;
  -- Explicit public projection and count remain usable after email protection.
  perform id, post_id, content, created_at from public.comments limit 1;
  perform count(id) from public.comments;

  execute 'reset role';
end;
$$;

rollback;
