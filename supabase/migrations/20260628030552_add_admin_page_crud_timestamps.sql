alter table public.journal
  add column if not exists updated_at timestamptz default now();

alter table public.todos
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists position integer default 0;

drop trigger if exists set_journal_updated_at on public.journal;
create trigger set_journal_updated_at
before update on public.journal
for each row
execute function public.set_updated_at();

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();
