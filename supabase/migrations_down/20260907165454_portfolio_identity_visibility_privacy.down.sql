-- Emergency compatibility rollback only: this restores the previous broader
-- project/comment access and profile-role admin model. Prefer a forward repair.

do $$
begin
  if exists (select 1 from public.projects where visibility <> 'public')
     or exists (select 1 from public.comments where nullif(user_email, '') is not null) then
    raise exception 'Rollback would expose private projects or comment emails; use a forward repair';
  end if;
end;
$$;

create or replace function public.is_gio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1 from public.user_profiles
      where public.user_profiles.user_id = (select auth.uid())
        and public.user_profiles.role = 'admin'
    ),
    false
  );
$$;

revoke all on function public.is_gio_admin() from public, anon, authenticated;
grant execute on function public.is_gio_admin() to authenticated, service_role;

drop policy if exists projects_gio_select on public.projects;
drop policy if exists projects_public_select on public.projects;
create policy projects_public_select
on public.projects
for select
to anon, authenticated
using (true);

revoke select (id, post_id, content, created_at, user_id)
  on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;

drop function if exists luis_ruiz_private.is_verified_owner();
-- No CASCADE: stop if another feature has begun to depend on this schema.
drop schema if exists luis_ruiz_private;

notify pgrst, 'reload schema';
