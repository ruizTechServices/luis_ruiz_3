alter table public.contactlist
  add column status text not null default 'new' check (status in ('new','contacted','qualified','won','lost','spam')),
  add column follow_up_at timestamptz,
  add column internal_notes text not null default '' check (char_length(internal_notes) <= 10000),
  add column updated_at timestamptz not null default now(),
  add column source_path text,
  add column source_project text;
create index contactlist_workflow_created on public.contactlist (status, created_at desc, id desc);
create index contactlist_due on public.contactlist (follow_up_at) where status in ('new','contacted','qualified') and follow_up_at is not null;
create or replace function luis_ruiz_private.touch_inquiry_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond'); return new; end;
$$;
revoke all on function luis_ruiz_private.touch_inquiry_updated_at() from public, anon, authenticated;
create trigger contactlist_workflow_updated before update on public.contactlist for each row execute function luis_ruiz_private.touch_inquiry_updated_at();
create table luis_ruiz_private.inquiry_limits (
  key text primary key check (char_length(key) <= 120),
  window_start timestamptz not null default now(),
  hits integer not null default 1 check (hits > 0)
);
create table luis_ruiz_private.inquiry_requests (
  request_id uuid primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  inquiry_id bigint not null references public.contactlist(id) on delete cascade,
  received_at timestamptz not null default now()
);
create index inquiry_requests_fingerprint on luis_ruiz_private.inquiry_requests (fingerprint, received_at desc);
alter table luis_ruiz_private.inquiry_limits enable row level security;
alter table luis_ruiz_private.inquiry_requests enable row level security;
revoke all on luis_ruiz_private.inquiry_limits, luis_ruiz_private.inquiry_requests from public, anon, authenticated;
grant usage on schema luis_ruiz_private to service_role;
grant all on luis_ruiz_private.inquiry_limits, luis_ruiz_private.inquiry_requests to service_role;
