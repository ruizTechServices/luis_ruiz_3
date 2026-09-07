-- Restore the documented verified-owner boundary and protect nonpublic content.
-- No user/profile rows are changed. This does not touch the shared public.posts table.

do $$
begin
  if not exists (
    select 1 from auth.users
    where lower(email) = 'giosterr44@gmail.com'
      and email_confirmed_at is not null
      and deleted_at is null
  ) then
    raise exception 'Verified site owner not found; refusing to change admin access';
  end if;
end;
$$;

-- Keep the privileged auth lookup outside the exposed public schema.
create schema if not exists luis_ruiz_private;
revoke all on schema luis_ruiz_private from public, anon, authenticated;
grant usage on schema luis_ruiz_private to authenticated, service_role;

create or replace function luis_ruiz_private.is_verified_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as owner
    where owner.id = (select auth.uid())
      and lower(owner.email) = 'giosterr44@gmail.com'
      and owner.email_confirmed_at is not null
      and owner.deleted_at is null
      and (owner.banned_until is null or owner.banned_until <= now())
  );
$$;

revoke all on function luis_ruiz_private.is_verified_owner() from public, anon, authenticated;
grant execute on function luis_ruiz_private.is_verified_owner() to authenticated, service_role;

-- Preserve the existing application RPC and policies, without exposing the
-- privileged implementation. Claims and user-editable profiles cannot grant admin.
create or replace function public.is_gio_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select luis_ruiz_private.is_verified_owner();
$$;

revoke all on function public.is_gio_admin() from public, anon, authenticated;
grant execute on function public.is_gio_admin() to authenticated, service_role;

drop policy if exists projects_public_select on public.projects;
drop policy if exists projects_gio_select on public.projects;

create policy projects_public_select
on public.projects
for select
to anon, authenticated
using (visibility = 'public');

create policy projects_gio_select
on public.projects
for select
to authenticated
using ((select public.is_gio_admin()));

-- RLS protects rows, not columns. Removing an email from React alone does not
-- prevent it being downloaded through the Data API. Use an explicit allowlist.
revoke select on public.comments from public, anon, authenticated;
revoke select (user_email) on public.comments from public, anon, authenticated;
grant select (id, post_id, content, created_at, user_id)
  on public.comments to anon, authenticated;

notify pgrst, 'reload schema';
