# Maintenance Log

Nightly maintenance runs, most recent first. Append-only.

---
## Run: 2026-06-29 10:16 UTC

### Git Activity (Last 24h)
1 commit:
- `e3a85e8` (2026-06-28 10:19) "Chore: docs updated. Updated Layout.tsx" — touched AGENTS.md, MAINTENANCE_LOG.md, TABLES_TO_DELETE.md, app/layout.tsx, docs/recent-considerations.md, supabase/migrations/20260628122120_backfill_orphaned_dashboard_ownership.sql.

Working tree (uncommitted) at run time: modified AGENTS.md, app/layout.tsx, docs/recent-considerations.md, lib/auth/admin.ts, lib/public-content/data.ts, and all of orin-nano/*. Untracked: seven Phase 2 migrations (20260628144339..20260628145033) and a new supabase/migrations_down/ folder. Branch: main (up to date with origin).

### DB Changes
- Dropped tables: none.
- Flagged for review: `project_blog_links` (0 rows, no code refs) — kept, not dropped (see note).
- Total tables: 23. Active/referenced: 22. Orphaned: 1 (`project_blog_links`).
- Reclassified ACTIVE (were flagged orphaned on 2026-06-28): `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages` — now surfaced read-only via lib/admin/data.ts `getAdminOverview()` + the new `/admin/legacy-ai` page. Removed from TABLES_TO_DELETE.md.
- ⚠️ Supabase `list_tables` row ESTIMATES were wrong this run (reported 0 for every table). Real counts obtained via exact `SELECT count(*)` and match prior figures (journal 54, todos 54, gios_context 26, round_robin_messages 154, conversations 32, etc.). Data is fully intact — no loss occurred.

### Docs Updated
- **AGENTS.md** — full rewrite (restored from the Next.js stub the working tree had reverted to). Now a complete LLM briefing: overview, tech stack (Next 16.2.9 / React 19 / Tailwind v4 / Supabase), structure map, exact schema table, current state, WIP, last-24h changes, known issues, next steps, run instructions, conventions. Preserved the "This is NOT the Next.js you know" warning block.
- **TABLES_TO_DELETE.md** — rewritten. Removed the five legacy AI tables (now referenced). Only `project_blog_links` remains flagged, with explicit reasoning for not auto-dropping it.
- **docs/recent-considerations.md** — appended a dated correction block flagging that journal/todos/documents/gios_context and the five legacy AI tables are no longer "unreferenced"; they are now wired into the admin interface.
- auth-routing.md, README.md, CLAUDE.md, orin-nano/*.md — checked, no stale schema references; left unchanged.

### Notes for Gio
- **Decision deviation (flagged, not executed):** strict maintenance policy says an orphaned + empty table (`project_blog_links`) should be auto-dropped. I did NOT drop it because docs/recent-considerations.md explicitly preserves it as a future-facing project↔blog linking stub. Dropping is irreversible; deferring to your prior intent. Drop it yourself only if that feature is abandoned: `DROP TABLE public.project_blog_links;`.
- **Phase 2 migrations are uncommitted/untracked** (7 files + migrations_down/). Review, commit, and confirm they're applied to the remote project to avoid migration-history drift.
- **AI persistence still undecided** — IndexedDB (lib/browser-db/*) vs. the legacy server-side tables now shown in /admin/legacy-ai. Resolve before any cleanup.
- **orin-nano/ line-ending churn:** every file shows full insert/delete diffs (~5.7k lines) with no real content change — almost certainly CRLF↔LF normalization. Recommend adding a `.gitattributes` (`* text=auto eol=lf`) to stop the noise.
- No TODO/FIXME/HACK comments found in app/, lib/, or components/.


---
## Run: 2026-06-28 (interactive follow-up, DB now reachable)

### DB Access
- The Supabase MCP token now has access to project `luis-ruiz`
  (`huyhgdsjpdjzokjwaspb`, org `uzesytfzdxtwnskcopuk`, Postgres 15). The earlier
  permission error is resolved; full schema audit ran successfully.

### Schema Audit (live, exact COUNT(*))
- Verified all 23 public tables. Counts matched the 2026-06-28 visibility doc
  exactly (e.g. projects 3, blog_posts 6, journal 54, todos 54, gios_context 26,
  conversations 32, chat_messages 28, chat_embeddings 18, round_robin_sessions
  27, round_robin_messages 154, user_profiles 19).
- Orphaned tables unchanged: `project_blog_links` (0, empty), `conversations`,
  `chat_messages`, `chat_embeddings`, `round_robin_sessions`,
  `round_robin_messages` (have rows). None dropped — the five data-bearing ones
  await the AI-persistence decision; the empty `project_blog_links` is left
  pending Gio's confirmation since it maps to a planned feature.

### DB Change Applied
- **Migration `20260628122120_backfill_orphaned_dashboard_ownership.sql`** (applied
  live + saved to `supabase/migrations/`). Root-caused the dashboard ownership
  mismatch: all 4 `dashboard_decisions` and all 9 `dashboard_system_links` rows
  had `user_id = NULL` (seeded 2026-05-20, before the ownership column was added
  2026-06-26), so RLS `(select auth.uid()) = user_id` hid them from Gio. Set
  their `user_id` to Gio's verified uid `f6794b1c-0ed7-4f3c-9cad-9c2776de83e4`.
  Post-fix verification: 4/4 and 9/9 rows Gio-owned, 0 NULL remaining. Other
  `dashboard_*` tables were empty, so no further backfill.

### Docs Updated
- `AGENTS.md` — schema section now marked "verified live 2026-06-28" with exact
  counts; ownership mismatch documented as RESOLVED with prevention guidance;
  next-steps updated (added optional `NOT NULL` hardening on `dashboard_*.user_id`).
- `TABLES_TO_DELETE.md` — counts marked verified-live; removed "DB unreachable"
  caveats; clarified nothing was dropped.
- `docs/recent-considerations.md` — ownership rows marked fixed; deletion-section
  ownership item rewritten as RESOLVED with the migration reference.

### Notes for Gio
- Dashboard should now show your 4 decisions and 9 system links when signed in.
- Recommended follow-up: add `NOT NULL` to `dashboard_*.user_id` so a future
  service-role seed can't silently re-orphan rows.
- Still open: AI-persistence direction for the 5 legacy data tables; the empty
  `project_blog_links` drop decision.

---
## Run: 2026-06-28 04:07 UTC

### Git Activity (Last 24h)
Branch: `main` (up to date with `origin/main`).

- `05c576a` (~38 min ago) — Stage Supabase data into public dashboard and admin pages. Touched `app/(authenticated)/admin/*`, `app/(authenticated)/dashboard/*`, `app/blog/*`, `app/projects/*`, `app/contact/*`, `app/page.tsx`, `components/data/*`, `components/navigation/site-navbar.tsx`, `lib/admin/*`, `lib/auth/*`, `lib/dashboard/*`, `lib/data/*`, `lib/navigation/nav-links.ts`, `lib/public-content/data.ts`, `lib/supabase/dynamic-table.ts`, `scripts/verify-auth-flow.mjs`, `supabase/migrations/20260628030552_add_admin_page_crud_timestamps.sql`.
- `2fbec50` (~2 h ago) — docs(supabase): add DB visibility map. Added `docs/recent-considerations.md`; edited `app/page.tsx`.
- `168ab45` (~3 h ago) — chore(supabase): harden admin and table permissions. Added migrations `20260627225925`, `20260627230551`, `20260627230809`; `supabase/config.toml`, `supabase/.gitignore`.

Uncommitted (unstaged) working changes: `orin-nano/README`, `orin-nano/cheat-sheet.md`, `orin-nano/contemplation-strategy.md`, `orin-nano/docs.md`, `orin-nano/logging-implementation-1.md`, `orin-nano/toy-app-plan-1.md`, `orin-nano/toy-app-plan-2.md`.

### DB Changes
- **DB unreachable this run.** The codebase's live Supabase project (ref `huyhgdsjpdjzokjwaspb`, from `.env.local`) is NOT accessible to the maintenance agent's Supabase MCP token — `list_tables` returned "You do not have permission to perform this action", and the ref is not in the token's `list_projects` output (token only sees: `Worksheet-generator`, `orin-nano-chatbot`, `ruizTechStudio`). Steps 2–4 of the live-DB audit were skipped per policy.
- Dropped tables: none (cannot reach DB; policy also forbids dropping tables with rows).
- Flagged for review: `round_robin_messages`, `round_robin_sessions`, `conversations`, `chat_messages`, `chat_embeddings` (orphaned + have rows), and `project_blog_links` (orphaned + empty; would normally be auto-dropped but DB unreachable). See `TABLES_TO_DELETE.md`.
- Total active tables (from code references + 2026-06-28 audit doc): 17 ACTIVE, 6 ORPHANED (23 total documented).

### Docs Updated
- **`AGENTS.md`** — full rewrite into the standard LLM-briefing structure (overview, stack, structure, schema, current state, WIP, last-24h changes, known issues, next steps, run instructions, conventions). Preserved the `nextjs-agent-rules` block. Documented the DB-access limitation prominently.
- **`TABLES_TO_DELETE.md`** — created. Flagged the 6 orphaned tables with inherited counts and per-table drop guidance; noted DB was unreachable.
- **`MAINTENANCE_LOG.md`** — created (this file).
- **`docs/recent-considerations.md`** — corrected the now-stale "`app/page.tsx` is currently static" note; the homepage now reads Supabase via `getHomeContent()` (commit `05c576a`). Rest of the document still valid.
- **`docs/auth-routing.md`** — reviewed; still accurate, no changes needed.
- **`orin-nano/*.md`** — separate Jetson Orin Nano planning effort, unrelated to the web app DB; left untouched (and currently has uncommitted edits by Gio).

### Notes for Gio
- **Action needed: Supabase access.** The maintenance agent can't audit your live DB because its MCP token has no permission on project `huyhgdsjpdjzokjwaspb`. Either add that project to the token's scope or run the schema/row/drop steps manually. Until then, nightly DB facts are inferred from code + the 2026-06-28 visibility doc and may drift.
- **Homepage is now data-driven** — good. Worth updating any other docs that still assume a static landing page.
- **Dashboard ownership mismatch persists:** `dashboard_decisions` (4 rows) and `dashboard_system_links` (9 rows) hold data but your simulated session saw 0 rows. Check which `user_id` owns those rows before building more dashboard UI.
- **AI-persistence decision is still open:** five data-bearing server-side AI tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`) are unused by the app, which persists Orin chats in IndexedDB. Decide migrate/archive/revive — they're the bulk of the orphaned-data risk.
- **Uncommitted `orin-nano/*` edits** — commit or discard so the working tree is clean.
- No `TODO`/`FIXME` markers found in `lib/` or `app/api/`.
