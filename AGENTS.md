<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Project Briefing for AI Assistants
> Last updated: 2026-06-29 10:16 UTC
> Maintained automatically by the nightly maintenance agent.
> **Any LLM starting work on this project should read this file first.**

---

## 1. Project Overview
This is **luis-ruiz** (`luis_ruiz_3`) — the personal website, portfolio, and private admin/dashboard application of Luis Giovanni Ruiz ("Gio"). It serves a public-facing side (home page, project portfolio, blog, contact form) and a private authenticated side (a personal admin console for editing content, and a per-user business dashboard tracking projects, clients, leads, money, decisions, and system links).

Admin authority is reserved exclusively for Gio, identified by the verified Supabase auth email `giosterr44@gmail.com` via the `public.is_gio_admin()` SQL function. Admin status is **stateless** — it is derived from the verified auth email, never from `user_profiles.role`.

## 2. Tech Stack
- **Frontend/Framework:** Next.js `16.2.9` (App Router) — **non-standard version; consult `node_modules/next/dist/docs/` before coding.** React `19.2.4`.
- **Language:** TypeScript `^5` throughout.
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss`), `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **UI components:** shadcn (`shadcn ^4.11.0`) + Radix UI (`radix-ui ^1.6.0`), `lucide-react` icons. Component registry config in `components.json`.
- **Database:** Supabase (PostgreSQL 15) — project ref `huyhgdsjpdjzokjwaspb`, name `luis-ruiz`, region `us-east-1`.
- **Auth:** Supabase Auth with SSR cookies via `@supabase/ssr`; Google OAuth. Server identity resolved from the verified JWT (`supabase.auth.getClaims()`), never from client/route input.
- **Client-side storage:** IndexedDB via `idb ^8` (`lib/browser-db/*`) — current Orin AI chat persistence lives here, NOT in Supabase.
- **Hosting:** Vercel (intended; standard Next.js deploy). Not yet confirmed live.

## 3. Project Structure
```
/app
  /(authenticated)        → Protected route group; layout.tsx calls requireUser()
    /account              → Current user's account (no [userId] route by design)
    /admin                → Gio-only admin console (see admin pages below)
      actions.ts          → Server actions for admin CRUD
      page.tsx            → Admin overview (counts via getAdminOverview)
      /blog-posts /projects /site-settings /contactlist /journal /todos
      /comments /votes /documents /gios-context
    /dashboard            → Per-user business dashboard
      /projects /clients /leads /money /decisions /links
  /account /login /auth/callback   → Public auth entry points
  /blog  /blog/[id]                → Public blog (reads comments + votes stats)
  /projects  /projects/[slug]      → Public portfolio
  /contact                         → Public contact form (inserts into contactlist)
  /api/ai/{chat,embed,health}      → AI routes; each calls requireApiUser() → 401 if unauthenticated
/components
  /auth /data /home /navigation /ui
  /data/admin-table-page.tsx       → Generic admin CRUD table UI
  /data/dashboard-table-page.tsx   → Generic dashboard table UI
/lib
  /admin        → config.ts (ADMIN_TABLES registry), data.ts (getAdminOverview), mutations.ts
  /ai           → contracts.ts, ollama-config.ts
  /api          → envelope.ts, fetch-with-timeout.ts, safe-json.ts
  /auth         → session.ts (getClaims/requireUser), routes.ts (protected prefixes), admin.ts
  /browser-db   → database.ts, repository.ts (IndexedDB Orin chat persistence)
  /dashboard    → data.ts (owner-scoped reads), mutations.ts
  /data         → form.ts, format.ts
  /logging      → client.ts, server.ts, shared.ts (structured logging across auth flow)
  /navigation   → nav-links.ts (link visibility model)
  /public-content → data.ts (getHomeContent: site_settings + projects + blog_posts + comment/vote stats)
  /supabase     → client.ts, server.ts, proxy.ts, env.ts, dynamic-table.ts
/scripts        → verify-auth-flow.mjs  (npm run test:auth)
/supabase
  /migrations       → forward migrations (timestamped .sql)
  /migrations_down  → matching rollback scripts (.down.sql)
/docs           → auth-routing.md, recent-considerations.md
/orin-nano      → Notes/plans for the "Orin" AI assistant work (Jetson Orin Nano context)
AGENTS.md            → THIS FILE — read first
CLAUDE.md            → @AGENTS.md include + user/date context
MAINTENANCE_LOG.md   → Nightly maintenance change log (append-only)
TABLES_TO_DELETE.md  → Orphaned tables pending cleanup
```

## 4. Database Schema (Supabase)
Project ref `huyhgdsjpdjzokjwaspb`. **Row counts below are exact `COUNT(*)` values as of 2026-06-29.**
> ⚠️ Do NOT trust `list_tables` row estimates — they read from stale pg statistics and reported all tables as 0 this run. Always confirm counts with `SELECT count(*)`.

| Table | Rows | Purpose | Status |
|-------|-----:|---------|--------|
| `blog_posts` | 6 | Public blog/articles | ACTIVE — public read + admin CRUD |
| `projects` | 3 | Public portfolio records | ACTIVE — public read + admin CRUD |
| `site_settings` | 1 | Site config (availability, etc.) | ACTIVE — public read + admin CRUD |
| `contactlist` | 2 | Contact-form submissions (sensitive) | ACTIVE — public insert, Gio-only read |
| `comments` | 0 | Blog comments | ACTIVE — public blog + admin moderation |
| `votes` | 0 | Blog votes | ACTIVE — public blog + admin moderation |
| `journal` | 54 | Gio-only personal journal | ACTIVE — admin CRUD |
| `todos` | 54 | Gio-only task list | ACTIVE — admin CRUD |
| `documents` | 1 | Admin vector/doc knowledge base | ACTIVE — admin read-only (match_documents) |
| `gios_context` | 26 | Gio-specific context vectors | ACTIVE — admin read-only (match_gios_context) |
| `user_profiles` | 19 | Auth profile rows | ACTIVE — created by handle_new_user() trigger |
| `conversations` | 32 | Retired server-side AI conversations | ORPHANED — see TABLES_TO_DELETE.md |
| `chat_messages` | 28 | Retired server-side AI messages | ORPHANED — see TABLES_TO_DELETE.md |
| `chat_embeddings` | 18 | Retired server-side AI embeddings | ORPHANED — see TABLES_TO_DELETE.md |
| `round_robin_sessions` | 27 | Retired multi-model AI sessions | ORPHANED — see TABLES_TO_DELETE.md |
| `round_robin_messages` | 154 | Messages for retired round-robin sessions | ORPHANED — see TABLES_TO_DELETE.md |
| `dashboard_projects` | 0 | User-owned dashboard projects | ACTIVE — owner-scoped CRUD |
| `dashboard_clients` | 0 | User-owned clients | ACTIVE — owner-scoped CRUD |
| `dashboard_leads` | 0 | User-owned leads | ACTIVE — owner-scoped CRUD |
| `dashboard_money_entries` | 0 | User-owned financial entries | ACTIVE — owner-scoped CRUD |
| `dashboard_decisions` | 4 | User-owned decisions | ACTIVE — owner-scoped CRUD |
| `dashboard_system_links` | 9 | User-owned system links | ACTIVE — owner-scoped CRUD |
| `project_blog_links` | 0 | Empty project↔blog join table | ORPHANED — see TABLES_TO_DELETE.md |

> Orphaned tables are tracked in `TABLES_TO_DELETE.md`. The retired server-side
> AI tables still hold data and require export/captured-DDL handling before any
> drop; `project_blog_links` is empty and preserved only as a possible future
> linking stub.

## 5. Current State of the Project
Working and live in code:
- **Auth:** Supabase SSR auth with Google OAuth, structured logging across the flow, server-side route protection via `proxy.ts` → `lib/supabase/proxy.ts`, and the `(authenticated)` route group enforcing `requireUser()`. Protected prefixes: `/account`, `/dashboard`. `/api/ai/*` enforces `requireApiUser()`.
- **Public site:** Home page (`app/page.tsx`) is **dynamic** as of commit `05c576a` — it reads live Supabase data through `lib/public-content/data.ts` (`getHomeContent()`): availability text from `site_settings`, featured `projects`, recent `blog_posts`, plus comment/vote stats. Public projects, blog, and contact pages are wired to their tables.
- **Admin console (`/admin`, Gio-only):** Generic config-driven CRUD over `ADMIN_TABLES` (`lib/admin/config.ts`). Editable: blog_posts, projects, site_settings, journal, todos. Insert-disabled (view/moderate): contactlist, comments, votes. Read-only: documents, gios_context.
- **Dashboard (`/dashboard`, per-user):** Owner-scoped reads through `lib/dashboard/data.ts`, filtered by verified `auth.uid()`.
- **DB security:** RLS hardened across all tables; Gio-admin access gated by `is_gio_admin()` on verified email. Storage: `photos` bucket public (portfolio media), `user_profile_pictures` private (owner-scoped).

## 6. Work in Progress
- **Phase 2 RLS/ownership migrations (uncommitted, untracked):** Seven new migration files dated 2026-06-28 (`phase2_s1`..`phase2_s9`) plus a new `supabase/migrations_down/` rollback set are staged on disk but **not yet committed**. They cover: transitional→final admin function (`is_gio_admin`), profile constraints, an aggregate function, comments/votes ownership, contactlist policies, and a `dashboard` NOT NULL constraint. These should be reviewed and committed (and applied to the remote DB if not already).
- **AGENTS.md churn:** The committed AGENTS.md (HEAD) had been reverted in the working tree to the Next.js stub before this run; this maintenance run restored the full briefing.

## 7. Recent Changes (Last 24h)
One commit in the last 24h:
- `e3a85e8` (2026-06-28 10:19) — *Chore: docs updated. Updated Layout.tsx*. Touched: `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, `app/layout.tsx`, `docs/recent-considerations.md`, and migration `20260628122120_backfill_orphaned_dashboard_ownership.sql`.

Recent prior commits for context: `05c576a` staged Supabase data into public + admin pages; `2fbec50` added the DB visibility map; `168ab45` hardened admin/table permissions; `84972f1` added structured auth logging.

Uncommitted working-tree changes at run time: modified `AGENTS.md`, `app/layout.tsx`, `docs/recent-considerations.md`, `lib/auth/admin.ts`, `lib/public-content/data.ts`, and the entire `orin-nano/` folder; untracked Phase 2 migrations and `migrations_down/`.

## 8. Known Issues / Open Questions
- **Retired server-side AI tables still hold data.** Current Orin chat uses IndexedDB (`lib/browser-db/*`); the five retired server-side AI tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`) still exist in Supabase and are flagged in `TABLES_TO_DELETE.md` for an export-then-drop cleanup.
- **`project_blog_links` is orphaned** (0 rows, no code refs) but intentionally kept as future-facing. Confirm the project↔blog linking feature before dropping.
- **Phase 2 migrations are uncommitted** — risk of drift between local DB state and the tracked migration history. Commit and verify they are applied remotely.
- **`orin-nano/` whole-file diffs** — every file shows massive insert/delete churn (likely line-ending/encoding normalization, e.g. CRLF↔LF), not real content change. Worth a `.gitattributes` to normalize line endings.
- No `TODO`/`FIXME`/`HACK` comments found in `app`, `lib`, or `components`.

## 9. Next Steps
Most likely next actions for Gio:
1. Review and commit the Phase 2 migrations + `migrations_down/` rollbacks; confirm they are applied to the remote project.
2. Resolve the AI-persistence decision (IndexedDB vs. revive server-side tables) and either build on or archive the legacy AI tables.
3. Populate the now-dynamic public pages with real `projects`/`blog_posts` content and verify the contact form write path end-to-end.
4. Decide the fate of `project_blog_links` (build the linking feature or drop it).
5. Add `.gitattributes` to stop `orin-nano/` line-ending churn.

## 10. How to Run Locally
```bash
npm install
npm run dev         # next dev → http://localhost:3000
npm run build       # next build
npm run start       # next start
npm run lint        # eslint
npm run test:auth   # node scripts/verify-auth-flow.mjs
```
Required env (`.env.local`, see `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://huyhgdsjpdjzokjwaspb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
(Additional AI/Ollama env may be required for `/api/ai/*` — see `lib/ai/ollama-config.ts`.)

## 11. Conventions & Preferences
- Gio prefers **modular code with strict separation of concerns** ("respect separation of concerns to the 'T'").
- **TypeScript throughout**; data access isolated in `lib/*/data.ts` + `lib/*/mutations.ts` modules.
- **Security model:** never trust client-supplied identity. Resolve the user from the verified server-side session (`getClaims()`); gate admin on `is_gio_admin()` (verified email), never on `user_profiles.role`. No `/[userId]` routes — avoids IDOR.
- **Admin surface is config-driven:** add a table to `ADMIN_TABLES` in `lib/admin/config.ts` (with `readOnly`/`deleteOnly`/`createDisabled` flags) rather than hand-coding pages.
- **Migrations:** every forward migration in `supabase/migrations/` should have a matching rollback in `supabase/migrations_down/`. Service-role inserts into `dashboard_*` tables must set `user_id` explicitly (the `auth.uid()` default is bypassed and would orphan rows).
- **This is a non-standard Next.js (16.2.9).** Read `node_modules/next/dist/docs/` before writing framework code.
