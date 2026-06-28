-- Lock unowned legacy tables to the verified Gio admin.
-- These tables have no user_id/owner column, so broad authenticated writes are not safe.

drop policy if exists journal_authenticated_select on public.journal;
drop policy if exists journal_authenticated_insert on public.journal;
drop policy if exists todos_authenticated_select on public.todos;
drop policy if exists todos_authenticated_insert on public.todos;
drop policy if exists todos_authenticated_update on public.todos;
drop policy if exists todos_authenticated_delete on public.todos;

create policy journal_gio_select
on public.journal
for select
to authenticated
using ((select public.is_gio_admin()));

create policy journal_gio_insert
on public.journal
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy journal_gio_update
on public.journal
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy journal_gio_delete
on public.journal
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy todos_gio_select
on public.todos
for select
to authenticated
using ((select public.is_gio_admin()));

create policy todos_gio_insert
on public.todos
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy todos_gio_update
on public.todos
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy todos_gio_delete
on public.todos
for delete
to authenticated
using ((select public.is_gio_admin()));

revoke all privileges on public.journal from anon, authenticated;
revoke all privileges on public.todos from anon, authenticated;

grant select, insert, update, delete on public.journal to authenticated;
grant select, insert, update, delete on public.todos to authenticated;
grant usage on sequence public.journal_id_seq to authenticated;
grant usage on sequence public.todos_id_seq to authenticated;
