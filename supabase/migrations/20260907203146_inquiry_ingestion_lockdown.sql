-- Apply only after the browser form uses the deployed Edge ingestion function.
drop policy if exists contactlist_anon_insert on public.contactlist;
drop policy if exists contactlist_owner_insert on public.contactlist;
drop policy if exists contactlist_owner_select on public.contactlist;
drop policy if exists contactlist_owner_update on public.contactlist;
drop policy if exists contactlist_owner_delete on public.contactlist;
revoke all on public.contactlist from anon, authenticated;
grant select on public.contactlist to authenticated;
grant update(status,follow_up_at,internal_notes) on public.contactlist to authenticated;
grant all on public.contactlist to service_role;
