drop policy if exists comments_authenticated_insert on public.comments;
drop policy if exists comments_owner_update on public.comments;
drop policy if exists comments_owner_delete on public.comments;
drop policy if exists comments_admin_update on public.comments;
drop policy if exists comments_admin_delete on public.comments;

create policy comments_authenticated_insert
on public.comments
for insert
to authenticated
with check (lower(user_email) = lower((select auth.email())));

create policy comments_gio_update
on public.comments
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy comments_gio_delete
on public.comments
for delete
to authenticated
using ((select public.is_gio_admin()));

drop policy if exists votes_authenticated_insert on public.votes;
drop policy if exists votes_owner_update on public.votes;
drop policy if exists votes_owner_delete on public.votes;
drop policy if exists votes_admin_select on public.votes;
drop policy if exists votes_admin_update on public.votes;
drop policy if exists votes_admin_delete on public.votes;

create policy votes_public_select
on public.votes
for select
to anon, authenticated
using (true);

create policy votes_authenticated_insert
on public.votes
for insert
to authenticated
with check (lower(user_email) = lower((select auth.email())));

create policy votes_gio_update
on public.votes
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy votes_gio_delete
on public.votes
for delete
to authenticated
using ((select public.is_gio_admin()));

alter table public.votes
  drop column if exists user_id;

alter table public.comments
  drop column if exists user_id;
