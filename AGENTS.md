<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Project Briefing for AI Assistants
> Last updated: 2026-07-02 04:05 UTC
> Maintained automatically by the nightly maintenance agent.
> **Any LLM starting work on this project should read this file first.**

---

## 1. Project Overview
This is **luis-ruiz** (`luis_ruiz_3`) — the personal website, portfolio, and private admin/dashboard application of Luis Giovanni Ruiz ("Gio"). It serves a public-facing side (home page, project portfolio, blog, contact form, public sitemap) and a private authenticated side (a personal admin console for editing content, and a per-user business dashboard tracking projects, clients, leads, money, decisions, and system links).

Admin authority is reserved exclusively for Gio, identified by the verified Supabase auth email `giosterr44@gmail.com` via the `public.is_gio_admin()` SQL function. Admin status is **stateless** — it is derived from the verified auth email, never from `user_profiles.role`.

## 2. Tech Stack
- **Frontend/Framework:** Next.js `16.2.9` (App Router) — **non-standard version; consult `node_modules/next/dist/docs/` before coding.** React `19.2.4`.
- **Language:** TypeScript `^5` throughout.
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss`), `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **UI components:** shadcn (`shadcn ^4.11.0`) + Radix UI (`radix-ui ^1.6.0`), `lucide-react` icons. Component registry config in `components.json`.
- **Validation:** `zod ^4`.
- **Database:** Supabase (PostgreSQL 15.14) — project ref `huyhgdsjpdjzokjwaspb`, name `luis-ruiz`, region `us-east-1`, status `ACTIVE_HEALTHY`.
- **Auth:** Supabase Auth with SSR cookies via `@supabase/ssr`; Google OAuth. Server identity resolved from the verified JWT (`supabase.auth.getClaims()`), never from client/route input.
- **Client-side storage:** IndexedDB via `idb ^8` (`lib/browser-db/*`) — Orin AI chat persistence lives here, NOT in Supabase. (Its IndexedDB object stores are named `conversations`/`messages`/`memories` — these are NOT Supabase tables.)
- **SEO:** Next.js Metadata Route sitemap (`app/sitemap.ts` → `lib/seo/sitemap.ts`), `/sitemap.xml` revalidated hourly, plus a human-readable `/sitemap` page.
- **Hosting:** Vercel (intended; production domain fallback `https://luis-ruiz.com`). Not yet confirmed live.

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
/public
  /videos/hero-bg-lighting-1.mp4   → NEW hero background video asset (untracked; not yet wired into a page)
  /contact                         → Public contact form (inserts into contactlist)
  /sitemap                         → Human-readable public sitemap page
  sitemap.ts                       → Next.js metadata route → /sitemap.xml (hourly revalidate)
  /api/ai/{chat,embed,health}      → AI routes; each calls requireApiUser() → 401 if unauthenticated
/components
  /auth /data /home /navigation /ui
  /data/admin-table-page.tsx       → Generic admin CRUD table UI
  /data/dashboard-table-page.tsx   → Generic dashboard table UI
  /navigation/site-navbar.tsx      → Primary nav (lib/navigation/nav-links.ts)
  /navigation/site-footer.tsx      → Global footer (holds utility links e.g. /sitemap)
/lib
  /admin        → config.ts (ADMIN_TABLES registry), data.ts (getAdminOverview), mutations.ts + per-table crud/queries/types
  /ai           → contracts.ts, ollama-config.ts
  /api          → envelope.ts, fetch-with-timeout.ts, safe-json.ts
  /auth         → session.ts (getClaims/requireUser), routes.ts (protected prefixes), admin.ts
  /browser-db   → database.ts, repository.ts (IndexedDB Orin chat persistence)
  /dashboard    → data.ts (owner-scoped reads), mutations.ts
  /data         → form.ts, format.ts
  /logging      → client.ts, server.ts, shared.ts (structured logging across auth flow)
  /navigation   → nav-links.ts (link visibility model)
  /public-content → data.ts (getHomeContent: site_settings + projects + blog_posts + comment/vote stats)
  /seo          → site-url.ts (getSiteUrl/absoluteUrl origin resolution), sitemap.ts (buildSitemap impl)
  /supabase     → client.ts, server.ts, proxy.ts, env.ts, dynamic-table.ts
/scripts        → verify-auth-flow.mjs (npm run test:auth), verify-sitemap.mjs (npm run test:sitemap)
/supabase
  /migrations       → forward migrations (13 timestamped .sql)
  /migrations_down  → matching rollback scripts (.down.sql)
/docs           → auth-routing.md, recent-considerations.md, sitemap-maintenance.md
/orin-nano      → Notes/plans for the "Orin" AI assistant work (Jetson Orin Nano context)
AGENTS.md            → THIS FILE — read first
CLAUDE.md            → @AGENTS.md include + user/date context
MAINTENANCE_LOG.md   → Nightly maintenance change log (append-only)
TABLES_TO_DELETE.md  → Orphaned tables pending cleanup (currently empty)
```

## 4. Database Schema (Supabase)
Project ref `huyhgdsjpdjzokjwaspb`. **Row counts below are exact `COUNT(*)` values, re-verified 2026-07-02 — unchanged since 2026-06-30.**
> ⚠️ Do NOT trust `list_tables` row estimates — they read from stale pg statistics and reported all tables as 0 (except `user_profiles`) this run. Always confirm counts with `SELECT count(*)`.
>
> **There are currently 17 tables in `public`, and ALL are ACTIVE.** The five retired server-side AI tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`) and the empty `project_blog_links` join table — previously flagged as orphaned — **have been dropped since the last run.** `TABLES_TO_DELETE.md` is now empty.

| Table | Rows | Purpose | Status |
|-------|-----:|---------|--------|
| `blog_posts` | 6 | Public blog/articles | ACTIVE — public read + admin CRUD |
| `projects` | 3 | Public portfolio records | ACTIVE — public read + admin CRUD; sitemap reads `slug`/`visibility` |
| `site_settings` | 1 | Site config (availability, etc.) | ACTIVE — public read + admin CRUD |
| `contactlist` | 2 | Contact-form submissions (sensitive) | ACTIVE — public insert, Gio-only read |
| `comments` | 0 | Blog comments | ACTIVE — public blog + admin moderation |
| `votes` | 0 | Blog votes | ACTIVE — public blog + admin moderation |
| `journal` | 54 | Gio-only personal journal | ACTIVE — admin CRUD (`/admin/journal`) |
| `todos` | 54 | Gio-only task list | ACTIVE — admin CRUD (`/admin/todos`) |
| `documents` | 1 | Admin vector/doc knowledge base | ACTIVE — admin read-only (match_documents) |
| `gios_context` | 26 | Gio-specific context vectors | ACTIVE — admin read-only (match_gios_context) |
| `user_profiles` | 19 | Auth profile rows | ACTIVE — created by handle_new_user() trigger |
| `dashboard_projects` | 0 | User-owned dashboard projects | ACTIVE — owner-scoped CRUD |
| `dashboard_clients` | 0 | User-owned clients | ACTIVE — owner-scoped CRUD |
| `dashboard_leads` | 0 | User-owned leads | ACTIVE — owner-scoped CRUD |
| `dashboard_money_entries` | 0 | User-owned financial entries | ACTIVE — owner-scoped CRUD |
| `dashboard_decisions` | 4 | User-owned decisions | ACTIVE — owner-scoped CRUD (Gio-owned) |
| `dashboard_system_links` | 9 | User-owned system links | ACTIVE — owner-scoped CRUD (Gio-owned) |

> No tables are currently orphaned. If any future table loses all code references,
> flag it in `TABLES_TO_DELETE.md` (and drop only if it is empty).

## 5. Current State of the Project
Working and live in code:
- **Auth:** Supabase SSR auth with Google OAuth, structured logging across the flow, server-side route protection via `proxy.ts` → `lib/supabase/proxy.ts`, and the `(authenticated)` route group enforcing `requireUser()`. Protected prefixes: `/account`, `/dashboard`. `/api/ai/*` enforces `requireApiUser()`.
- **Public site:** Home page (`app/page.tsx`) is **dynamic** — it reads live Supabase data through `lib/public-content/data.ts` (`getHomeContent()`): availability text from `site_settings`, featured `projects`, recent `blog_posts`, plus comment/vote stats. Public projects, blog, and contact pages are wired to their tables.
- **SEO / sitemap (NEW):** `app/sitemap.ts` (Next.js metadata route) serves `/sitemap.xml`, revalidated hourly, built by `lib/seo/sitemap.ts`. It emits static public routes plus dynamic `projects` (filtered `visibility='public'`, non-null `slug`) and `blog_posts` rows; private/admin/api routes are excluded by design. A human-readable `/sitemap` page (`app/sitemap/page.tsx`) consumes the same builder. Origin resolution is centralized in `lib/seo/site-url.ts` (env order: `NEXT_PUBLIC_SITE_URL` → `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `https://luis-ruiz.com`). The `/sitemap` link lives in the global footer (`components/navigation/site-footer.tsx`). Guardrail: `scripts/verify-sitemap.mjs` (`npm run test:sitemap`). Full playbook in `docs/sitemap-maintenance.md`.
- **Admin console (`/admin`, Gio-only):** Generic config-driven CRUD over `ADMIN_TABLES` (`lib/admin/config.ts`). Editable: blog_posts, projects, site_settings, journal, todos. Insert-disabled (view/moderate): contactlist, comments, votes. Read-only: documents, gios_context. (The legacy AI inventory/count surface was removed — commit `7b33e4c`.)
- **Dashboard (`/dashboard`, per-user):** Owner-scoped reads through `lib/dashboard/data.ts`, filtered by verified `auth.uid()`.
- **DB security:** RLS hardened across all tables; Gio-admin access gated by `is_gio_admin()` on verified email. Storage: `photos` bucket public (portfolio media), `user_profile_pictures` private (owner-scoped). 13 forward migrations with matching `migrations_down/` rollbacks; the Phase 2 RLS/ownership migration set is now **committed**.

## 6. Work in Progress
- **New hero video asset (untracked):** `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB, added 2026-07-01 ~01:03) appeared in the working tree but is not yet referenced by any page or committed. Strong signal Gio is about to build a video-background hero on the home page (`app/page.tsx`). Not yet wired in.
- No uncommitted application-code feature work at run time. The Phase 2 RLS/ownership migrations and `migrations_down/` rollbacks are committed to `main`.
- Persistent working-tree noise: the entire `orin-nano/` folder shows whole-file diffs (line-ending churn — 5748 insertions / 5748 deletions, i.e. CRLF↔LF normalization, not real content change). Still unresolved — no `.gitattributes` exists yet.

## 7. Recent Changes (Last 24h)
**No commits in the strict last-24h window.** `HEAD` is still `1e73737` (2026-06-30 15:05, ~37h before this run). The working tree carries only uncommitted documentation edits from the prior maintenance runs (`AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, `docs/recent-considerations.md`) plus the untracked hero video and the persistent `orin-nano/` line-ending churn. **No new application-code work since the last run.**

**Resolved this run — dead AI RPCs are gone:** the helper functions previously flagged for removal (`match_chat_embeddings`, `match_chat_messages`, `get_next_chat_id`, `next_chat_id`) no longer exist in the `public` schema (verified via `pg_proc`). Only `match_documents` and `match_gios_context` remain, and both are valid/active. The dropped RPCs are now referenced only inside the historical migration `20260627225925_...sql` (correct — migrations are immutable records) and by no live app code. This cleanup follow-up is closed.

Recent commits for context (all outside the 24h window):
- `1e73737` (2026-06-30 15:05) — *chore: updated md file and docs* (a prior maintenance commit). Current `HEAD`.
- `75892c1` (2026-06-29 13:05) — *feat(seo): add public sitemap page and footer link*.
- `7b33e4c` (2026-06-29 07:26) — *chore(admin): remove legacy AI inventory surface* (removed the count-only viewer for the retired AI tables).
- `4c2d3c4` (2026-06-29 07:12) — *feat(admin): add CRUD pages for admin knowledge tables* (journal, todos, documents, gios_context surfaced in admin).

No schema changes this run — the 17 `public` tables and their exact `COUNT(*)` row counts are identical to the last run. (The six previously-orphaned AI/join tables were dropped in an earlier run and remain gone.)

## 8. Known Issues / Open Questions
- **Untracked hero video** — `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB) is in the working tree but untracked and unused. Decide whether to commit it to the repo (2.7 MB in git is acceptable but not ideal — consider Git LFS or serving from Supabase Storage/CDN) and wire it into the home hero, or discard it.
- **`orin-nano/` whole-file diffs** — every file shows massive equal insert/delete churn (5748/5748 lines), which is line-ending/encoding normalization (CRLF↔LF), not real content change. Add a `.gitattributes` (e.g. `* text=auto eol=lf`) to stop the noise, then commit the normalization once. STILL UNRESOLVED across multiple runs.
- **Public content is thin** — `projects` (3) and `blog_posts` (6) have content, but `dashboard_*` working tables and `comments`/`votes` are mostly empty. Verify the contact-form write path (`contactlist`, 2 rows) end-to-end.
- **Hosting not confirmed live** — Vercel deploy intended; set `NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com` in production so the sitemap emits absolute production URLs (not localhost/fallback).
- No `TODO`/`FIXME`/`HACK` comments found in `app`, `lib`, or `components`.
- **Dropped-table cleanup follow-up — RESOLVED (2026-07-02):** the orphaned helper RPCs for the dropped AI tables (`match_chat_embeddings`, `match_chat_messages`, `get_next_chat_id`/`next_chat_id`) no longer exist in the DB. Nothing further to do; only the historical migration still names them.

## 9. Next Steps
Most likely next actions for Gio:
1. Wire `public/videos/hero-bg-lighting-1.mp4` into the home hero (`app/page.tsx`) as a background video, then commit it (or move it to CDN/Storage + Git LFS if repo weight is a concern).
2. Add `.gitattributes` to normalize line endings and stop the `orin-nano/` churn; commit the one-time normalization.
3. Commit the outstanding working-tree changes — the uncommitted doc edits have now accumulated across several maintenance runs without a commit; a `chore(docs)` commit would clear the noise and make future 24h git diffs meaningful.
4. Populate public pages with real `projects`/`blog_posts` content and verify the contact form write path end-to-end.
5. Configure production hosting (Vercel) and `NEXT_PUBLIC_SITE_URL`; verify `/sitemap.xml` serves absolute production URLs and submit to Google Search Console.
6. Decide the AI-persistence direction (IndexedDB-only vs. rebuild server-side) now that the legacy server-side AI tables are gone.

## 10. How to Run Locally
```bash
npm install
npm run dev          # next dev → http://localhost:3000
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
npm run test:auth    # node scripts/verify-auth-flow.mjs
npm run test:sitemap # node scripts/verify-sitemap.mjs  (run AFTER npm run build)
```
Required env (`.env.local`, see `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://huyhgdsjpdjzokjwaspb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Production SEO:
NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com
```
(Additional AI/Ollama env may be required for `/api/ai/*` — see `lib/ai/ollama-config.ts`.)

## 11. Conventions & Preferences
- Gio prefers **modular code with strict separation of concerns** ("respect separation of concerns to the 'T'").
- **TypeScript throughout**; data access isolated in `lib/*/data.ts` + `lib/*/mutations.ts` modules.
- **Security model:** never trust client-supplied identity. Resolve the user from the verified server-side session (`getClaims()`); gate admin on `is_gio_admin()` (verified email), never on `user_profiles.role`. No `/[userId]` routes — avoids IDOR.
- **Admin surface is config-driven:** add a table to `ADMIN_TABLES` in `lib/admin/config.ts` (with `readOnly`/`deleteOnly`/`createDisabled` flags) rather than hand-coding pages.
- **Migrations:** every forward migration in `supabase/migrations/` should have a matching rollback in `supabase/migrations_down/`. Service-role inserts into `dashboard_*` tables must set `user_id` explicitly (the `auth.uid()` default is bypassed and would orphan rows).
- **Sitemap discipline:** new public pages must be reflected in `lib/seo/sitemap.ts` (static routes in `STATIC_ROUTES`, dynamic collections via filtered public-only queries); private/admin/api/auth routes must never appear. Centralize the origin via `lib/seo/site-url.ts`; never scatter the domain or use `new Date()` as `lastModified`. Utility links go in the footer, primary destinations in `lib/navigation/nav-links.ts`. Full rules in `docs/sitemap-maintenance.md`.
- **This is a non-standard Next.js (16.2.9).** Read `node_modules/next/dist/docs/` before writing framework code.
