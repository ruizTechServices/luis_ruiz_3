<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Project Briefing for AI Assistants
> Last updated: 2026-06-28 04:07 UTC
> Maintained automatically by the nightly maintenance agent.
> **Any LLM starting work on this project should read this file first.**

---

## 1. Project Overview

This is **`luis_ruiz_3`**, the personal portfolio + private operations site for Luis Giovanni Ruiz ("Gio"). It serves two audiences from one Next.js codebase:

1. **Public visitors** — a portfolio homepage, a projects gallery, a blog, and a contact form. Public content is read from Supabase (projects, blog posts, site settings).
2. **Gio (single admin) and authenticated users** — a private `/dashboard` (solo-founder CRM: projects, clients, leads, money, decisions, links) and an `/admin` area (CRUD over public content + personal journal/todos + AI knowledge tables).

Authority is stateless and email-based: the only admin is the verified Supabase auth email `giosterr44@gmail.com`, checked via the Postgres function `public.is_gio_admin()`. There is also an experimental on-device AI assistant ("Orin") whose current chat persistence lives in browser IndexedDB, not Supabase. The `orin-nano/` folder holds planning docs for an NVIDIA Jetson Orin Nano edge-AI toy app and is largely independent of the web app.

## 2. Tech Stack

- **Framework:** Next.js **16.2.9** (App Router, React Server Components). ⚠️ This is a newer Next.js than most training data — read `node_modules/next/dist/docs/` before writing framework code.
- **Language:** TypeScript 5, React 19.2.4 / React DOM 19.2.4.
- **UI:** Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn-style components (`components/ui`), Radix UI primitives, `lucide-react` icons, `class-variance-authority` + `clsx` + `tailwind-merge`.
- **Database / Auth:** Supabase (PostgreSQL 17). SSR auth via `@supabase/ssr` + `@supabase/supabase-js`. Cookie-based sessions; identity resolved server-side from the verified JWT.
- **Client-side storage:** `idb` (IndexedDB) for Orin chat persistence (`lib/browser-db/*`).
- **Hosting:** Vercel (structured JSON logs are written to `console.*` to surface in Vercel function logs). A Vercel MCP is connected in tooling.
- **Notable:** `server-only` package guards server modules; `proxy.ts` (Next.js proxy/middleware equivalent) enforces auth before protected pages render.

## 3. Project Structure

```
app/                          → Next.js App Router
  page.tsx                    → Public homepage (reads Supabase via getHomeContent())
  projects/, blog/, contact/  → Public pages (contact has a server action)
  login/, auth/callback/      → Supabase auth entry + OAuth callback
  account/                    → Public account stub
  api/ai/{chat,embed,health}/ → Protected AI API routes (requireApiUser, 401 if anon)
  (authenticated)/            → Protected route group; layout.tsx calls requireUser()
    account/                  → Authenticated account page
    admin/<slug>/             → Gio-only CRUD pages (config-driven)
    dashboard/<slug>/         → Owner-scoped solo-CRM pages (config-driven)
components/
  ui/                         → shadcn-style primitives (Button, etc.)
  data/                       → admin-table-page.tsx, dashboard-table-page.tsx (shared CRUD UI)
  home/, navigation/, auth/   → Page-specific components
lib/
  admin/{config,data,mutations}.ts     → Admin tables registry + server reads/writes
  dashboard/{data,mutations}.ts        → Dashboard tables registry + owner-scoped reads/writes
  public-content/data.ts               → Public homepage/blog/projects reads
  auth/{session,admin,routes}.ts       → Identity (getClaims), is-Gio check, protected prefixes
  supabase/{server,proxy,dynamic-table}.ts → Supabase clients + table whitelist helper
  navigation/nav-links.ts              → Nav link registry (filtered by visibility)
  data/{form,format}.ts                → Form parsing + display formatting
  logging/server.ts                    → serverLog / serverLogError (JSON lines)
  browser-db/*                         → IndexedDB (Orin chat persistence)
scripts/verify-auth-flow.mjs           → `npm run test:auth`
supabase/migrations/                   → SQL migrations (timestamped)
docs/auth-routing.md                   → Auth + routing reference (authoritative)
docs/recent-considerations.md          → DB visibility map (who can see what)
orin-nano/                             → Jetson Orin Nano edge-AI toy-app planning docs (separate effort)
AGENTS.md                              → THIS FILE — read first
CLAUDE.md                              → `@AGENTS.md` include only
MAINTENANCE_LOG.md                     → Nightly change log
TABLES_TO_DELETE.md                    → Orphaned-table review queue
```

## 4. Database Schema (Supabase)

> ✅ **Live DB verified 2026-06-28.** The codebase's active Supabase project is ref `huyhgdsjpdjzokjwaspb` (project name `luis-ruiz`, org `uzesytfzdxtwnskcopuk`, Postgres 15), set in `NEXT_PUBLIC_SUPABASE_URL` (`.env.local`). Row counts below are exact `COUNT(*)` results queried this run.

| Table | Rows* | Purpose | Status |
|-------|------:|---------|--------|
| `projects` | 3 | Public portfolio / case-study records | ACTIVE (public-content + admin) |
| `blog_posts` | 6 | Public blog/article records | ACTIVE (public-content + admin) |
| `site_settings` | 1 | Public site config (availability text) | ACTIVE (public-content + admin) |
| `contactlist` | 2 | Contact-form submissions (insert-only public; Gio reads) | ACTIVE (contact action + admin) |
| `comments` | 0 | Public blog comments (auth insert; Gio moderates) | ACTIVE (admin + public-content types) |
| `votes` | 0 | Public blog votes (auth insert; Gio moderates) | ACTIVE (admin + public-content types) |
| `journal` | 54 | Gio-only personal journal | ACTIVE (admin page) |
| `todos` | 54 | Gio-only personal todos | ACTIVE (admin page) |
| `documents` | 1 | Admin vector/document knowledge base | ACTIVE (admin read-only; `match_documents()`) |
| `gios_context` | 26 | Gio-specific context/memory vectors | ACTIVE (admin read-only; `match_gios_context()`) |
| `dashboard_projects` | 0 | Owner-scoped CRM projects | ACTIVE (dashboard) |
| `dashboard_clients` | 0 | Owner-scoped clients | ACTIVE (dashboard) |
| `dashboard_leads` | 0 | Owner-scoped leads | ACTIVE (dashboard) |
| `dashboard_money_entries` | 0 | Owner-scoped financial entries | ACTIVE (dashboard) |
| `dashboard_decisions` | 4 | Owner-scoped decisions | ACTIVE (dashboard) |
| `dashboard_system_links` | 9 | Owner-scoped system links | ACTIVE (dashboard) |
| `user_profiles` | 19 | Auth profile rows (trigger-created on signup) | ACTIVE (auth backbone) |
| `project_blog_links` | 0 | Join table projects↔blog | ORPHANED (not referenced in app code; empty) |
| `conversations` | 32 | Legacy/server-side AI conversations | ORPHANED (app uses IndexedDB instead) |
| `chat_messages` | 28 | Legacy/server-side AI messages | ORPHANED (app uses IndexedDB instead) |
| `chat_embeddings` | 18 | Legacy/server-side AI embeddings | ORPHANED (`match_chat_embeddings()` only) |
| `round_robin_sessions` | 27 | Legacy/future multi-model AI sessions | ORPHANED (not referenced in app code) |
| `round_robin_messages` | 154 | Messages for round-robin sessions | ORPHANED (not referenced in app code) |

\* Exact `COUNT(*)` verified against the live DB on 2026-06-28.

**Key functions/RPCs:** `is_gio_admin()`, `get_blog_posts_with_stats()`, `match_documents()`, `match_gios_context()`, `match_chat_messages()`, `match_chat_embeddings()`, `handle_new_user()` (signup trigger), `set_updated_at()` / `update_updated_at_column()` (triggers), `get_next_chat_id()` / `next_chat_id()` (no current callers found).

**Storage buckets:** `photos` (public, 9 objects — portfolio media), `user_profile_pictures` (private, owner-scoped, 1 object).

> Orphaned tables that still hold rows are catalogued in `TABLES_TO_DELETE.md`. None were dropped — the maintenance agent cannot reach this DB, and per policy never drops tables that contain rows.

## 5. Current State of the Project

Working and live in the codebase:

- **Public homepage** (`app/page.tsx`) now renders **live Supabase data** via `lib/public-content/data.ts` → `getHomeContent()` (availability text from `site_settings`, featured `projects`, recent `blog_posts`). This is new as of the latest commit and supersedes the older "homepage is static" note in `docs/recent-considerations.md`.
- **Public pages:** `/projects`, `/projects/[slug]`, `/blog`, `/blog/[id]`, `/contact` (with a server action writing to `contactlist`).
- **Auth:** Supabase SSR auth with cookie sessions; Google OAuth via `/auth/callback`; protected prefixes `/account` and `/dashboard` enforced in `proxy.ts` + the `(authenticated)` layout. Structured auth logging is in place. See `docs/auth-routing.md`.
- **Admin area** (`/admin/*`): config-driven CRUD (`lib/admin/config.ts` → `ADMIN_TABLES`) over blog posts, projects, site settings, contact list (read/delete), journal, todos, comments, votes; documents and gios_context are read-only.
- **Dashboard** (`/dashboard/*`): owner-scoped CRUD over `dashboard_*` tables, every read/write filtered by `user_id = auth.uid()` plus RLS.
- **AI API** (`/api/ai/{chat,embed,health}`): protected by `requireApiUser()`, returns 401 when anonymous.

## 6. Work in Progress

- **Wiring Supabase into public + admin/dashboard surfaces.** The latest commit ("Stage Supabase data into public dashboard and admin pages") touched nearly every page and the `lib/admin`, `lib/dashboard`, and `lib/public-content` modules — the data layer is being connected end-to-end.
- **Admin CRUD timestamps:** migration `20260628030552_add_admin_page_crud_timestamps.sql` just added `updated_at`/`created_at`/`position` columns and `set_updated_at` triggers to `journal` and `todos`.
- **Uncommitted working changes:** the `orin-nano/*` planning docs are modified but not staged (see `git status`).
- **Open AI-persistence decision:** server-side AI tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_*`) exist with data but the app currently persists Orin chats in IndexedDB. Direction not yet decided.

## 7. Recent Changes (Last 24h)

From `git log` on `main`:

- **`05c576a`** (~38 min ago) — *Stage Supabase data into public dashboard and admin pages.* Broad change across `app/*` (admin, dashboard, blog, projects, contact, homepage), `components/data/*`, `components/navigation/*`, `lib/admin/*`, `lib/auth/*`, `lib/dashboard/*`, `lib/data/*`, `lib/navigation/*`, `lib/public-content/data.ts`, `lib/supabase/dynamic-table.ts`, `scripts/verify-auth-flow.mjs`, and migration `20260628030552_add_admin_page_crud_timestamps.sql`.
- **`2fbec50`** (~2 h ago) — *docs(supabase): add DB visibility map.* Added `docs/recent-considerations.md`; edited `app/page.tsx`.
- **`168ab45`** (~3 h ago) — *chore(supabase): harden admin and table permissions.* Added three hardening migrations (`20260627225925`, `20260627230551`, `20260627230809`) and `supabase/config.toml` / `.gitignore`. Tightened RLS, grants, function execution; moved admin authority to verified auth email.

Uncommitted: modifications to seven `orin-nano/*` docs (not staged).

## 8. Known Issues / Open Questions

- **Stale doc note:** `docs/recent-considerations.md` said `app/page.tsx` is "currently static … not wired into the visible homepage yet." This is now **out of date** — the homepage reads Supabase via `getHomeContent()`. (Corrected note added to that file.)
- **Dashboard ownership mismatch — RESOLVED 2026-06-28.** Root cause: all 4 `dashboard_decisions` and all 9 `dashboard_system_links` rows were seeded on 2026-05-20 with `user_id = NULL`, before the ownership column (`user_id default auth.uid()`) was added on 2026-06-26. RLS gates on `(select auth.uid()) = user_id`, and `NULL` never matches, so Gio's session saw 0 rows. Fixed by migration `20260628122120_backfill_orphaned_dashboard_ownership.sql`, which set those rows' `user_id` to Gio's verified uid `f6794b1c-0ed7-4f3c-9cad-9c2776de83e4`. All other dashboard tables were empty, so no other backfill was needed. **Prevention:** any future seed/import into `dashboard_*` tables must set `user_id` explicitly (or run as the authenticated owner so `default auth.uid()` fires) — service-role inserts bypass the default and will re-orphan rows. Consider adding a `NOT NULL` constraint on `dashboard_*.user_id` to make this fail loudly instead of silently hiding rows.
- **Orphaned data tables:** `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages` hold data but no app code path reads them. Decide migrate / archive / revive. See `TABLES_TO_DELETE.md`.
- **Logged-in OAuth runtime path** still needs a real-browser verification after Google sign-in (per `docs/auth-routing.md`).

## 9. Next Steps

Inferred from current trajectory:

1. Finish wiring and verifying the staged Supabase reads across admin and dashboard pages (the in-flight commit), then run `npm run test:auth`, `npm run lint`, `npm run build`.
2. (Optional hardening) Add `NOT NULL` to `dashboard_*.user_id` so ownerless rows can never be inserted again (the ownership bug fixed in `20260628122120` was caused by NULL being allowed).
3. Decide the AI-persistence direction (IndexedDB vs. the server-side `conversations`/`chat_*`/`round_robin_*` tables) and either wire or retire them.
4. Commit or discard the modified `orin-nano/*` docs.

## 10. How to Run Locally

```bash
npm install
npm run dev        # Next.js dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint
npm run test:auth  # node scripts/verify-auth-flow.mjs (static auth-flow checks)
```

Required env vars (`.env.local`, see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (currently `https://huyhgdsjpdjzokjwaspb.supabase.co`).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable/anon key.

Logged-out runtime smoke checks (dev server running):

```bash
curl -i http://localhost:3000/account       # → redirect to /login?next=%2Faccount
curl -i http://localhost:3000/dashboard     # → redirect to /login?next=%2Fdashboard
curl -i http://localhost:3000/api/ai/health # → 401
```

## 11. Conventions & Preferences

- **Modular, strict separation of concerns** — Gio insists on this. Config registries (`ADMIN_TABLES`, `DASHBOARD_PAGE_TABLES`) drive shared UI components (`components/data/*`); per-table logic stays declarative.
- **TypeScript everywhere.** Server-only modules import `server-only` to prevent client bundling.
- **Security is server-side, never trust the client.** Identity comes from `supabase.auth.getClaims()` (`lib/auth/session.ts`), never from route params, query, or form fields. Admin = verified email via `is_gio_admin()`, never `user_profiles.role`. Dashboard reads are double-gated: `.eq("user_id", user.id)` in code **and** RLS in Postgres. There are intentionally no `/account/[userId]` or `/dashboard/[userId]` routes (avoids IDOR).
- **The navbar is presentation only** — it is not an authorization boundary; the layout + proxy are.
- **Structured logging** via `lib/logging/server.ts` (`serverLog` / `serverLogError`) as JSON lines to `console.*`; scopes like `auth.actions`, `auth.callback`, `auth.proxy`, `auth.session`. Never log secrets — only verified `sub`/`email` claims.
- **Supabase changes go through timestamped migrations** in `supabase/migrations/` (format `YYYYMMDDHHMMSS_description.sql`).
- **Next.js 16 is non-standard** — always consult `node_modules/next/dist/docs/` before writing framework code.
