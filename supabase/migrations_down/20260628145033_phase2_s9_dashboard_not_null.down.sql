alter table public.dashboard_system_links
  alter column user_id drop not null;

alter table public.dashboard_decisions
  alter column user_id drop not null;

alter table public.dashboard_money_entries
  alter column user_id drop not null;

alter table public.dashboard_leads
  alter column user_id drop not null;

alter table public.dashboard_clients
  alter column user_id drop not null;

alter table public.dashboard_projects
  alter column user_id drop not null;
