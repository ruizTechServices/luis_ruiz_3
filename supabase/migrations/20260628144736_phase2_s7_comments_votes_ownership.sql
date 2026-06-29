alter table public.comments
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

drop policy if exists comments_authenticated_insert on public.comments;
drop policy if exists comments_gio_update on public.comments;
drop policy if exists comments_gio_delete on public.comments;

create policy comments_authenticated_insert
on public.comments
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy comments_owner_update
on public.comments
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy comments_owner_delete
on public.comments
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy comments_admin_update
on public.comments
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy comments_admin_delete
on public.comments
for delete
to authenticated
using ((select public.is_gio_admin()));

drop policy if exists votes_public_select on public.votes;
drop policy if exists votes_authenticated_insert on public.votes;
drop policy if exists votes_gio_update on public.votes;
drop policy if exists votes_gio_delete on public.votes;

create policy votes_authenticated_insert
on public.votes
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy votes_owner_update
on public.votes
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy votes_owner_delete
on public.votes
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy votes_admin_select
on public.votes
for select
to authenticated
using ((select public.is_gio_admin()));

create policy votes_admin_update
on public.votes
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy votes_admin_delete
on public.votes
for delete
to authenticated
using ((select public.is_gio_admin()));
