-- Backfill ownerless dashboard rows to Gio.
-- These rows were seeded on 2026-05-20, before the user_id ownership column
-- (default auth.uid()) was added on 2026-06-26. They had user_id = NULL, so RLS
-- [(select auth.uid()) = user_id] hid them from Gio's authenticated session
-- (dashboard showed 0 rows even though 4 decisions and 9 system links existed).
-- Assigning them to Gio's verified auth uid makes the owner-scoped dashboard
-- show them again. The content is Gio's own founder data (architecture
-- decisions + system links to his GitHub, Supabase, Vercel, ruizTechServices).

update public.dashboard_decisions
set user_id = 'f6794b1c-0ed7-4f3c-9cad-9c2776de83e4'
where user_id is null;

update public.dashboard_system_links
set user_id = 'f6794b1c-0ed7-4f3c-9cad-9c2776de83e4'
where user_id is null;
