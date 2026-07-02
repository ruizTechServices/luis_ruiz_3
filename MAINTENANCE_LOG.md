# Maintenance Log

Nightly maintenance runs, most recent first. Append-only.

---
## Run: 2026-07-02 04:05 UTC

### Git Activity (Last 24h)
**No commits in the strict last-24h window.** `HEAD` remains `1e73737` (2026-06-30 15:05, ~37h before this run). Branch `main`, up to date with `origin/main`.

Working tree (uncommitted) at run time — same character as prior runs:
- Documentation edits from prior maintenance runs still uncommitted: `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, `docs/recent-considerations.md`. These have now accrued across several runs without a commit — flagged in AGENTS.md §9 as a recommended `chore(docs)` commit.
- Untracked asset `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB) — still present, still not referenced by any page.
- `orin-nano/*` still showing whole-file line-ending churn only (~5748/5748 equal insert/delete, CRLF↔LF). No `.gitattributes` exists yet.
- No application-code changes.

### DB Changes
- Dropped tables: none.
- Flagged for review: none.
- Total active tables: **17** (all referenced in code).
- Exact `COUNT(*)` re-verified — **identical to last run**: blog_posts 6, projects 3, site_settings 1, contactlist 2, comments 0, votes 0, journal 54, todos 54, documents 1, gios_context 26, user_profiles 19, dashboard_projects 0, dashboard_clients 0, dashboard_leads 0, dashboard_money_entries 0, dashboard_decisions 4, dashboard_system_links 9.
- **RPC cleanup RESOLVED:** the dead helper functions flagged in prior runs (`match_chat_embeddings`, `match_chat_messages`, `get_next_chat_id`, `next_chat_id`) **no longer exist** in `public` (verified via `pg_proc`). Only `match_documents` and `match_gios_context` remain — both valid/active. The dropped functions are named only in the historical migration `20260627225925_...sql` (immutable) and by no live app code.
- ⚠️ `list_tables` estimates still unreliable in this project — always confirm with `SELECT count(*)`.

### Docs Updated
- `AGENTS.md` — bumped "Last updated" + §4 verification date to 2026-07-02; updated §7 (HEAD aged to ~37h; added the resolved-RPC note); §8 Known Issues (dead-RPC follow-up marked RESOLVED); §9 Next Steps (replaced the RPC-removal item with a recommendation to commit the accumulated doc changes).
- `TABLES_TO_DELETE.md` — bumped review timestamp; converted the RPC "Follow-up" section to RESOLVED. Still **no tables flagged**.
- `docs/recent-considerations.md` — extended the stale banner to note the `match_chat_*`/`*_chat_id` RPCs are now themselves dropped.
- `MAINTENANCE_LOG.md` — this entry.

### Notes for Gio
- Quietest run yet: zero code changes, zero schema changes. The only real state change since the last run is that the dead AI RPCs are gone — that cleanup is now fully closed.
- The uncommitted doc edits have piled up across multiple maintenance runs. Consider a single `chore(docs)` commit so future 24h git diffs actually reflect your work, not maintenance churn.
- Still open (unchanged): untracked hero video not wired in, no `.gitattributes` for the `orin-nano/` CRLF churn.

---
## Run: 2026-07-01 22:56 UTC

### Git Activity (Last 24h)
**No commits in the strict last-24h window.** `HEAD` remains `1e73737` (2026-06-30 15:05, ~32h before this run). Branch `main`, up to date with `origin/main`.

Working tree (uncommitted) at run time — unchanged in character from the previous run:
- Documentation edits from the prior maintenance run still uncommitted: `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, `docs/recent-considerations.md`.
- Untracked asset `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB) — still present, still not referenced by any page (grep for `hero-bg-lighting` → 0 code hits).
- `orin-nano/*` still showing whole-file line-ending churn only (~5748/5748 equal insert/delete, CRLF↔LF). No `.gitattributes` exists yet.
- No application-code changes.

### DB Changes
- Dropped tables: none.
- Flagged for review: none.
- Total active tables: **17** (all referenced in code; verified by grep this run).
- Exact `COUNT(*)` re-verified — **identical to last run**: blog_posts 6, projects 3, site_settings 1, contactlist 2, comments 0, votes 0, journal 54, todos 54, documents 1, gios_context 26, user_profiles 19, dashboard_projects 0, dashboard_clients 0, dashboard_leads 0, dashboard_money_entries 0, dashboard_decisions 4, dashboard_system_links 9.
- ⚠️ `list_tables` estimates again stale/wrong (reported all 0 except user_profiles=1) — real counts came from `SELECT count(*)`.

### Docs Updated
- `AGENTS.md` — refreshed "Last updated" timestamp; rewrote §7 (Recent Changes) to reflect zero commits in the 24h window (`1e73737` has aged out).
- `TABLES_TO_DELETE.md` — refreshed review timestamp; still **none flagged**.
- `MAINTENANCE_LOG.md` — this entry.
- `docs/recent-considerations.md` — no change needed; already carries an accurate "PARTIALLY STALE" banner redirecting to AGENTS.md §4. Left as historical analysis.

### Notes for Gio
- **Nothing has changed since the last run** — no commits, no schema drift, no new/removed code. This was a verification-only pass.
- Three carry-over items still open (all previously noted): (1) wire in or discard the untracked hero video `public/videos/hero-bg-lighting-1.mp4`; (2) add a `.gitattributes` (`* text=auto eol=lf`) to kill the `orin-nano/` line-ending churn and commit the one-time normalization; (3) drop the now-dead RPCs left over from the retired AI tables (`match_chat_embeddings`, `match_chat_messages`, `get_next_chat_id`/`next_chat_id`) via a reversible migration.
- The prior run's doc edits are still sitting uncommitted in the working tree — consider committing them so the nightly briefing is versioned.
- No `TODO`/`FIXME`/`HACK` comments in `app`, `lib`, or `components`.

---
## Run: 2026-07-01 04:07 UTC

### Git Activity (Last 24h)
1 commit:
- `1e73737` (2026-06-30 15:05) "chore: updated md file and docs" — the **previous nightly maintenance run's commit**. Touched AGENTS.md, MAINTENANCE_LOG.md, TABLES_TO_DELETE.md, docs/recent-considerations.md. No application-code change.

For context (just outside the 24h window): `75892c1` "feat(seo): add public sitemap page and footer link" (2026-06-29 13:05), `7b33e4c` "chore(admin): remove legacy AI inventory surface", `4c2d3c4` "feat(admin): add CRUD pages for admin knowledge tables".

Working tree (uncommitted) at run time: all of `orin-nano/*` still showing line-ending churn only (equal 5748/5748 insert/delete), plus a **NEW untracked asset `public/videos/hero-bg-lighting-1.mp4`** (~2.7 MB, added ~01:03 UTC). No app-code changes staged. Branch: main (up to date with origin). Note: `.git/index.lock` could not be removed by the agent (permission), but no git writes were needed.

### DB Changes
- Dropped tables: none.
- Flagged for review: none. TABLES_TO_DELETE.md remains empty — no orphaned tables.
- Total active tables: 17 (all referenced in code; exact COUNT(*) verified live + grep cross-ref).
- Row counts (exact, UNCHANGED since last run): blog_posts 6, projects 3, site_settings 1, contactlist 2, comments 0, votes 0, journal 54, todos 54, documents 1, gios_context 26, user_profiles 19, dashboard_projects 0, dashboard_clients 0, dashboard_leads 0, dashboard_money_entries 0, dashboard_decisions 4, dashboard_system_links 9.
- Reminder: `list_tables` estimates were again wrong (reported all-zero except user_profiles=1); real counts came from `SELECT count(*)`.

### Docs Updated
- `AGENTS.md` — refreshed timestamp; added new `public/videos/hero-bg-lighting-1.mp4` hero asset to structure (§3), WIP (§6), Known Issues (§8), and Next Steps (§9, now the #1 next action); rewrote Recent Changes (§7) to the current 24h window (only `1e73737`); marked schema re-verified/unchanged (§4).
- `TABLES_TO_DELETE.md` — review date → 2026-07-01; still zero flags; noted grep cross-ref.
- `docs/recent-considerations.md` — added a prominent top-of-file STALE banner: the matrix rows for the six dropped AI/join tables and their RPCs are historical, not current; pointed to AGENTS.md §4 as authoritative. (Previous run had only a bottom note; the top tables still read as live.)
- `MAINTENANCE_LOG.md` — this entry.

### Notes for Gio
- **New hero video** `public/videos/hero-bg-lighting-1.mp4` is untracked and unused. Wire it into `app/page.tsx` as a background video and commit it — or move to CDN/Supabase Storage + Git LFS if you don't want a 2.7 MB binary in git. Right now it's neither in the repo nor rendered anywhere.
- **`orin-nano/*` CRLF↔LF churn is STILL unresolved** (multiple runs now). Add `.gitattributes` (`* text=auto eol=lf`) and commit the one-time normalization to stop this recurring every single run. This is low-effort and overdue.
- Dead-RPC cleanup still pending: `match_chat_embeddings(...)`, `match_chat_messages(...)`, `get_next_chat_id()`/`next_chat_id()` reference dropped tables. Remove via a reversible migration after confirming no callers.
- No `TODO`/`FIXME`/`HACK` comments in app/lib/components. No new migrations this run.

---
## Run: 2026-06-30 16:04 UTC

### Git Activity (Last 24h)
1 commit:
- `75892c1` (2026-06-29 13:05) "feat(seo): add public sitemap page and footer link" — touched app/layout.tsx, app/sitemap.ts, app/sitemap/page.tsx, components/navigation/site-footer.tsx, docs/sitemap-maintenance.md, lib/seo/site-url.ts, lib/seo/sitemap.ts, package.json (added `test:sitemap`), scripts/verify-sitemap.mjs.

For context (just outside the 24h window, 2026-06-29 morning): `7b33e4c` "chore(admin): remove legacy AI inventory surface" and `4c2d3c4` "feat(admin): add CRUD pages for admin knowledge tables".

Working tree (uncommitted) at run time: modified MAINTENANCE_LOG.md and all of orin-nano/* (line-ending churn only — equal 5748/5748 insert/delete). The Phase 2 migrations + migrations_down/ that were untracked last run are now COMMITTED. Branch: main (up to date with origin).

### DB Changes
- Dropped tables: none dropped by this run. **However, six tables flagged in prior runs were dropped from the project since the last run** and are now gone: `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`, `project_blog_links`.
- Flagged for review: none. TABLES_TO_DELETE.md is now empty — no orphaned tables remain.
- Total active tables: 17 (all referenced in code; exact COUNT(*) verified live).
- Row counts (exact): blog_posts 6, projects 3, site_settings 1, contactlist 2, comments 0, votes 0, journal 54, todos 54, documents 1, gios_context 26, user_profiles 19, dashboard_projects 0, dashboard_clients 0, dashboard_leads 0, dashboard_money_entries 0, dashboard_decisions 4, dashboard_system_links 9.

### Docs Updated
- `AGENTS.md` — full rewrite: schema table down to 17 ACTIVE tables (removed the 6 dropped tables), Phase 2 migrations marked committed, added the SEO/sitemap feature throughout (§3/§5/§11), refreshed Recent Changes / Known Issues / Next Steps.
- `TABLES_TO_DELETE.md` — cleared all flags; documented the six tables as dropped/resolved; noted dead-RPC follow-up.
- `docs/recent-considerations.md` — appended a 2026-06-30 note marking the six matrix rows (and their RPCs) as stale/dropped; pointed to AGENTS.md §4 as authoritative.
- `MAINTENANCE_LOG.md` — this entry.

### Notes for Gio
- `orin-nano/*` still shows whole-file diffs that are pure CRLF↔LF line-ending churn (5748 insertions / 5748 deletions, no content change). Add `.gitattributes` (`* text=auto eol=lf`) and commit the one-time normalization to stop this recurring every run.
- Dead-RPC cleanup: `match_chat_embeddings(...)`, `match_chat_messages(...)`, and `get_next_chat_id()`/`next_chat_id()` reference now-dropped tables. Remove with a reversible migration after confirming no callers.
- The IndexedDB object stores `conversations`/`messages`/`memories` in `lib/browser-db/*` are the active Orin chat layer — NOT Supabase tables; don't confuse with the dropped tables.
- No TODO/FIXME/HACK comments found in app/, lib/, or components/.
- For production SEO, set `NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com` so `/sitemap.xml` emits absolute production URLs.

---
## Run: 2026-06-29 10:16 UTC

### Git Activity (Last 24h)
1 commit:
- `e3a85e8` (2026-06-28 10:19) "Chore: docs updated. Updated Layout.tsx" â€” touched AGENTS.md, MAINTENANCE_LOG.md, TABLES_TO_DELETE.md, app/layout.tsx, docs/recent-considerations.md, supabase/migrations/20260628122120_backfill_orphaned_dashboard_ownership.sql.

Working tree (uncommitted) at run time: modified AGENTS.md, app/layout.tsx, docs/recent-considerations.md, lib/auth/admin.ts, lib/public-content/data.ts, and all of orin-nano/*. Untracked: seven Phase 2 migrations (20260628144339..20260628145033) and a new supabase/migrations_down/ folder. Branch: main (up to date with origin).

### DB Changes
- Dropped tables: none.
- Flagged for review: `project_blog_links` (0 rows, no code refs) â€” kept, not dropped (see note).
- Total tables: 23. Active/referenced: 22. Orphaned: 1 (`project_blog_links`).
- Current correction: the admin count-only viewer for retired server-side AI tables has been removed; `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, and `round_robin_messages` are again flagged in TABLES_TO_DELETE.md for export-then-drop review.
- âš ï¸ Supabase `list_tables` row ESTIMATES were wrong this run (reported 0 for every table). Real counts obtained via exact `SELECT count(*)` and match prior figures (journal 54, todos 54, gios_context 26, round_robin_messages 154, conversations 32, etc.). Data is fully intact â€” no loss occurred.

### Docs Updated
- **AGENTS.md** â€” full rewrite (restored from the Next.js stub the working tree had reverted to). Now a complete LLM briefing: overview, tech stack (Next 16.2.9 / React 19 / Tailwind v4 / Supabase), structure map, exact schema table, current state, WIP, last-24h changes, known issues, next steps, run instructions, conventions. Preserved the "This is NOT the Next.js you know" warning block.
- **TABLES_TO_DELETE.md** - rewritten at the time; that classification is now superseded by the current correction above.
- **docs/recent-considerations.md** â€” appended a dated correction block flagging that journal/todos/documents/gios_context and the five legacy AI tables are no longer "unreferenced"; they are now wired into the admin interface.
- auth-routing.md, README.md, CLAUDE.md, orin-nano/*.md â€” checked, no stale schema references; left unchanged.

### Notes for Gio
- **Decision deviation (flagged, not executed):** strict maintenance policy says an orphaned + empty table (`project_blog_links`) should be auto-dropped. I did NOT drop it because docs/recent-considerations.md explicitly preserves it as a future-facing projectâ†”blog linking stub. Dropping is irreversible; deferring to your prior intent. Drop it yourself only if that feature is abandoned: `DROP TABLE public.project_blog_links;`.
- **Phase 2 migrations are uncommitted/untracked** (7 files + migrations_down/). Review, commit, and confirm they're applied to the remote project to avoid migration-history drift.
- **Retired server-side AI cleanup pending** — IndexedDB (`lib/browser-db/*`) remains the current chat persistence path. Export and capture DDL before dropping the retired Supabase tables.
- **orin-nano/ line-ending churn:** every file shows full insert/delete diffs (~5.7k lines) with no real content change â€” almost certainly CRLFâ†”LF normalization. Recommend adding a `.gitattributes` (`* text=auto eol=lf`) to stop the noise.
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
  `round_robin_messages` (have rows). None dropped â€” the five data-bearing ones
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
- `AGENTS.md` â€” schema section now marked "verified live 2026-06-28" with exact
  counts; ownership mismatch documented as RESOLVED with prevention guidance;
  next-steps updated (added optional `NOT NULL` hardening on `dashboard_*.user_id`).
- `TABLES_TO_DELETE.md` â€” counts marked verified-live; removed "DB unreachable"
  caveats; clarified nothing was dropped.
- `docs/recent-considerations.md` â€” ownership rows marked fixed; deletion-section
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

- `05c576a` (~38 min ago) â€” Stage Supabase data into public dashboard and admin pages. Touched `app/(authenticated)/admin/*`, `app/(authenticated)/dashboard/*`, `app/blog/*`, `app/projects/*`, `app/contact/*`, `app/page.tsx`, `components/data/*`, `components/navigation/site-navbar.tsx`, `lib/admin/*`, `lib/auth/*`, `lib/dashboard/*`, `lib/data/*`, `lib/navigation/nav-links.ts`, `lib/public-content/data.ts`, `lib/supabase/dynamic-table.ts`, `scripts/verify-auth-flow.mjs`, `supabase/migrations/20260628030552_add_admin_page_crud_timestamps.sql`.
- `2fbec50` (~2 h ago) â€” docs(supabase): add DB visibility map. Added `docs/recent-considerations.md`; edited `app/page.tsx`.
- `168ab45` (~3 h ago) â€” chore(supabase): harden admin and table permissions. Added migrations `20260627225925`, `20260627230551`, `20260627230809`; `supabase/config.toml`, `supabase/.gitignore`.

Uncommitted (unstaged) working changes: `orin-nano/README`, `orin-nano/cheat-sheet.md`, `orin-nano/contemplation-strategy.md`, `orin-nano/docs.md`, `orin-nano/logging-implementation-1.md`, `orin-nano/toy-app-plan-1.md`, `orin-nano/toy-app-plan-2.md`.

### DB Changes
- **DB unreachable this run.** The codebase's live Supabase project (ref `huyhgdsjpdjzokjwaspb`, from `.env.local`) is NOT accessible to the maintenance agent's Supabase MCP token â€” `list_tables` returned "You do not have permission to perform this action", and the ref is not in the token's `list_projects` output (token only sees: `Worksheet-generator`, `orin-nano-chatbot`, `ruizTechStudio`). Steps 2â€“4 of the live-DB audit were skipped per policy.
- Dropped tables: none (cannot reach DB; policy also forbids dropping tables with rows).
- Flagged for review: `round_robin_messages`, `round_robin_sessions`, `conversations`, `chat_messages`, `chat_embeddings` (orphaned + have rows), and `project_blog_links` (orphaned + empty; would normally be auto-dropped but DB unreachable). See `TABLES_TO_DELETE.md`.
- Total active tables (from code references + 2026-06-28 audit doc): 17 ACTIVE, 6 ORPHANED (23 total documented).

### Docs Updated
- **`AGENTS.md`** â€” full rewrite into the standard LLM-briefing structure (overview, stack, structure, schema, current state, WIP, last-24h changes, known issues, next steps, run instructions, conventions). Preserved the `nextjs-agent-rules` block. Documented the DB-access limitation prominently.
- **`TABLES_TO_DELETE.md`** â€” created. Flagged the 6 orphaned tables with inherited counts and per-table drop guidance; noted DB was unreachable.
- **`MAINTENANCE_LOG.md`** â€” created (this file).
- **`docs/recent-considerations.md`** â€” corrected the now-stale "`app/page.tsx` is currently static" note; the homepage now reads Supabase via `getHomeContent()` (commit `05c576a`). Rest of the document still valid.
- **`docs/auth-routing.md`** â€” reviewed; still accurate, no changes needed.
- **`orin-nano/*.md`** â€” separate Jetson Orin Nano planning effort, unrelated to the web app DB; left untouched (and currently has uncommitted edits by Gio).

### Notes for Gio
- **Action needed: Supabase access.** The maintenance agent can't audit your live DB because its MCP token has no permission on project `huyhgdsjpdjzokjwaspb`. Either add that project to the token's scope or run the schema/row/drop steps manually. Until then, nightly DB facts are inferred from code + the 2026-06-28 visibility doc and may drift.
- **Homepage is now data-driven** â€” good. Worth updating any other docs that still assume a static landing page.
- **Dashboard ownership mismatch persists:** `dashboard_decisions` (4 rows) and `dashboard_system_links` (9 rows) hold data but your simulated session saw 0 rows. Check which `user_id` owns those rows before building more dashboard UI.
- **AI-persistence decision is still open:** five data-bearing server-side AI tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`) are unused by the app, which persists Orin chats in IndexedDB. Decide migrate/archive/revive â€” they're the bulk of the orphaned-data risk.
- **Uncommitted `orin-nano/*` edits** â€” commit or discard so the working tree is clean.
- No `TODO`/`FIXME` markers found in `lib/` or `app/api/`.
