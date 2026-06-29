alter table public.contactlist
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete set null;

drop policy if exists contactlist_public_insert on public.contactlist;
drop policy if exists contactlist_gio_select on public.contactlist;
drop policy if exists contactlist_gio_update on public.contactlist;
drop policy if exists contactlist_gio_delete on public.contactlist;

create policy contactlist_anon_insert
on public.contactlist
for insert
to anon
with check (user_id is null);

create policy contactlist_owner_select
on public.contactlist
for select
to authenticated
using (user_id = (select auth.uid()));

create policy contactlist_owner_insert
on public.contactlist
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy contactlist_owner_update
on public.contactlist
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy contactlist_owner_delete
on public.contactlist
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy contactlist_admin_select
on public.contactlist
for select
to authenticated
using ((select public.is_gio_admin()));

create policy contactlist_admin_update
on public.contactlist
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy contactlist_admin_delete
on public.contactlist
for delete
to authenticated
using ((select public.is_gio_admin()));
