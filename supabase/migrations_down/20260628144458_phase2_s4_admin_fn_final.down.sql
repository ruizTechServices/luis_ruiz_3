create or replace function public.is_gio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles
      where public.user_profiles.user_id = (select auth.uid())
        and public.user_profiles.role = 'admin'
    )
    or lower((select auth.email())) = 'giosterr44@gmail.com',
    false
  );
$$;

revoke all on function public.is_gio_admin() from public, anon, authenticated;
grant execute on function public.is_gio_admin() to authenticated;
