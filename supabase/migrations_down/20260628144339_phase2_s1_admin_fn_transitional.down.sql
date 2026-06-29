create or replace function public.is_gio_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower((select auth.email())) = 'giosterr44@gmail.com', false);
$$;

revoke all on function public.is_gio_admin() from public, anon, authenticated;
grant execute on function public.is_gio_admin() to authenticated;
