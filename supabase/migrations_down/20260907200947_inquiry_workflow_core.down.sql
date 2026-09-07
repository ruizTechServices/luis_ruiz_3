do $$ begin
 if exists(select 1 from public.contactlist where status <> 'new' or follow_up_at is not null or internal_notes <> '') then
  raise exception 'Preserve inquiry follow-ups and notes before rolling back.';
 end if;
end $$;
drop trigger if exists contactlist_workflow_updated on public.contactlist;
drop function if exists luis_ruiz_private.touch_inquiry_updated_at();
drop table if exists luis_ruiz_private.inquiry_requests;
drop table if exists luis_ruiz_private.inquiry_limits;
alter table public.contactlist drop column source_project, drop column source_path, drop column updated_at, drop column internal_notes, drop column follow_up_at, drop column status;
