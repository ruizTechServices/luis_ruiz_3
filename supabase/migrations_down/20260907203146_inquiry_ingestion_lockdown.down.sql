-- A rollback must retain private owner notes and close the spam bypass.
-- Restore a compatible Edge-backed form; never restore public table writes.
grant select on public.contactlist to authenticated;
grant update(status,follow_up_at,internal_notes) on public.contactlist to authenticated;
