drop policy if exists contactlist_anon_insert on public.contactlist;
drop policy if exists contactlist_owner_select on public.contactlist;
drop policy if exists contactlist_owner_insert on public.contactlist;
drop policy if exists contactlist_owner_update on public.contactlist;
drop policy if exists contactlist_owner_delete on public.contactlist;
drop policy if exists contactlist_admin_select on public.contactlist;
drop policy if exists contactlist_admin_update on public.contactlist;
drop policy if exists contactlist_admin_delete on public.contactlist;

create policy contactlist_public_insert
on public.contactlist
for insert
to anon, authenticated
with check (true);

create policy contactlist_gio_select
on public.contactlist
for select
to authenticated
using ((select public.is_gio_admin()));

create policy contactlist_gio_update
on public.contactlist
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy contactlist_gio_delete
on public.contactlist
for delete
to authenticated
using ((select public.is_gio_admin()));

alter table public.contactlist
  drop column if exists user_id;
