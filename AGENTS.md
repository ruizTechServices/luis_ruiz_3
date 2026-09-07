<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Project Briefing for AI Assistants

> **Current release note — 2026-09-07:** Production is confirmed on Vercel project `luis-ruiz-3`, from `ruizTechServices/luis_ruiz_3`, at `https://www.luis-ruiz.com`. Keep `_3` as the active repository. The existing Supabase project `huyhgdsjpdjzokjwaspb` is accessible in this session; the older access-failure notes below describe prior sessions. Publishing and privacy migrations have been applied and verified with database role tests. Owner identity now comes from the confirmed `auth.users` record through `public.is_gio_admin()`, independent of profile roles. Read [the current operations guide](docs/portfolio-operations.md) for the story editor, daily dashboard, exact release checks, and the remaining owner browser verification. Historical notes below are context, not current deployment evidence.

> Last updated: 2026-08-21 04:05 UTC
> Maintained automatically by the nightly maintenance agent.
> **Any LLM starting work on this project should read this file first.**
>
> ⚠️ **2026-08-21 — Supabase DB STILL NOT reachable (TWENTY-SEVENTH consecutive run).** The Supabase MCP connection exposes only org `chuzvccapvwvbdhmycyr`. This project's DB — ref `huyhgdsjpdjzokjwaspb` (`luis-ruiz`, read from `.env.local`) — is **not in the accessible project list**, and an explicit `list_tables` call against that ref again returned **`MCP error -32600: You do not have permission to perform this action`** — identical for twenty-seven runs straight. This is a stable authorization gap (wrong org scope on the agent's Supabase token), not an outage. §4 row counts could NOT be re-verified. **All schema/row numbers below are carried forward unverified from the 2026-07-10 audit — now 42 days stale.** No tables were dropped or altered.
>
> 🗓️ **Schedule note — cadence is irregular, NOT nightly.** The previous logged run was **2026-08-20 16:05 UTC**; this run is **2026-08-21 04:05 UTC** — a **~12-hour gap**, back to a roughly-nightly spacing. But the run before that sat ~3.5 days out, and the sequence over the last few weeks has swung ~12 days → ~11.5h → ~3.5 days → ~12h — clearly erratic, not a dependable nightly. Counters below track *runs*, not calendar days, so this is the 27th blind-DB run even though 42 calendar days have elapsed since the last successful audit. The erratic spacing reinforces the standing recommendation to put the agent on an explicit **weekly** cadence while the repo is idle. (Historical gap still noted: no run/log entry exists for 2026-07-31.)
>
> **The token is NOT broken — it is scoped to the wrong org (diagnosis settled; control test retired).** The visible org holds three projects: `ghost-ai-ruiztech` (`brjkuhvuizlzizctxlvy`, INACTIVE), `razzy-db` (`hswylmfyovrboeorfoqc`, ACTIVE), and `sota-board-lake` (`hnaqragfzyvdfwwadghj`, ACTIVE, created 2026-07-13). Four earlier runs (2026-07-14 → 2026-07-17) proved the token is healthy by reading `sota-board-lake` cleanly; that control test remains **retired** (re-proving a settled fact wasted a run each night) and was NOT re-run this run. `list_projects` this run again returned exactly those three projects under `chuzvccapvwvbdhmycyr` — target ref still absent. `huyhgdsjpdjzokjwaspb` simply lives under a different account/org and is unreachable from this connection. **Fix = authorize the owning org; this is a scope toggle, not a debugging job.**

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
- **Database:** Supabase (PostgreSQL) — project ref `huyhgdsjpdjzokjwaspb`, name `luis-ruiz`. (Engine version/region last confirmed 2026-07-10 as PG 15.14 / `us-east-1`; unverifiable since — see banner.)
- **Auth:** Supabase Auth with SSR cookies via `@supabase/ssr`; Google OAuth. Server identity resolved from the verified JWT (`supabase.auth.getClaims()`), never from client/route input.
- **Client-side storage:** IndexedDB via `idb ^8` (`lib/browser-db/*`) — Orin AI chat persistence lives here, NOT in Supabase. (Its IndexedDB object stores are named `conversations`/`messages`/`memories` — these are NOT Supabase tables.)
- **SEO:** Next.js Metadata Route sitemap (`app/sitemap.ts` → `lib/seo/sitemap.ts`), `/sitemap.xml` revalidated hourly, plus a human-readable `/sitemap` page.
- **Hosting:** Vercel (intended; production domain fallback `https://luis-ruiz.com`). Not yet confirmed live.

## 3. Project Structure
```
/app
  /(authenticated)        → Protected route group; layout.tsx calls requireUser()
    /account/page.tsx     → Current user's account (no [userId] route by design)
    /admin                → Gio-only admin console
      actions.ts          → Server actions for admin CRUD
      page.tsx            → Admin overview (counts via getAdminOverview)
      /blog-posts /projects /site-settings /contactlist /comments /votes
      /journal /todos /documents /gios-context   → per-table CRUD pages
    /dashboard            → Per-user business dashboard
      /projects /clients /leads /money /decisions /links
  /login  /auth/callback           → Public auth entry points
  /blog  /blog/[id]                → Public blog (reads comments + votes stats)
  /projects  /projects/[slug]      → Public portfolio
  /contact                         → Public contact form (inserts into contactlist)
  /sitemap                         → Human-readable public sitemap page
  sitemap.ts                       → Next.js metadata route → /sitemap.xml (hourly revalidate)
  layout.tsx  page.tsx             → Root layout + dynamic home page
  /api/ai/{chat,embed,health}      → AI routes; each calls requireApiUser() → 401 if unauthenticated
/public
  /videos/hero-bg-lighting-1.mp4   → Hero background video asset (COMMITTED in 2265049; still NOT wired into any page)
/components
  /auth      → auth-form.tsx, authenticated-marker.tsx, sign-out-form.tsx
  /data      → admin-table-page.tsx (generic admin CRUD UI), dashboard-table-page.tsx
  /home      → orin-nano-chat-card.tsx, portfolio-card.tsx
  /navigation→ site-navbar.tsx (lib/navigation/nav-links.ts), site-footer.tsx (holds /sitemap link)
  /ui        → button.tsx (shadcn primitives)
/lib
  /admin        → config.ts (ADMIN_TABLES registry), data.ts (getAdminOverview), mutations.ts,
                  crud/{action-result,form}.ts, and per-table {actions,queries,types}.ts for
                  documents · gios_context · journal · todos
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
  similarity.ts, utils.ts
/scripts        → verify-auth-flow.mjs (npm run test:auth), verify-sitemap.mjs (npm run test:sitemap)
/supabase
  /migrations       → forward migrations (13 timestamped .sql)
  /migrations_down  → matching rollback scripts (8 .down.sql)
  config.toml       → Supabase local config; project_id = "luis_ruiz_3" (LOCAL alias — NOT the
                      remote ref; the remote ref lives in .env.local). Its auth rate-limit
                      settings are Supabase built-ins, unrelated to the public.rate_limits table.
/docs           → auth-routing.md, recent-considerations.md, sitemap-maintenance.md
                  luis-ruiz-obsidian/ → Obsidian notes vault (STILL UNTRACKED in git as of
                                        2026-08-20; luis-ruiz/Welcome.md + 5 .obsidian/ state files)
/orin-nano      → Notes/plans for the "Orin" AI assistant work (Jetson Orin Nano context):
                  README, cheat-sheet.md, contemplation-strategy.md, docs.md,
                  logging-implementation-1.md, toy-app-plan-1.md, toy-app-plan-2.md
AGENTS.md            → THIS FILE — read first
CLAUDE.md            → @AGENTS.md include + user/date context
MAINTENANCE_LOG.md   → Nightly maintenance change log (append-only; ~142 KB — see §8)
TABLES_TO_DELETE.md  → Orphaned/flagged tables pending review
README.md            → ⚠️ still stock create-next-app boilerplate (see §8)
proxy.ts             → Root request proxy → lib/supabase/proxy.ts (route protection)
```

## 4. Database Schema (Supabase)
Project ref `huyhgdsjpdjzokjwaspb`. **⚠️ NOT re-verified on 2026-08-21 — the luis-ruiz Supabase project was again unreachable through the MCP connection (TWENTY-SEVENTH consecutive run; see the banner at the top of this file).** The row counts below are the last verified values from **2026-07-10** and are reproduced unchanged; treat them as last-known, **now 42 days stale**. Anyone needing authoritative counts must reconnect the Supabase account/org that owns `huyhgdsjpdjzokjwaspb` and re-run `SELECT count(*)`. **No tables were dropped or modified this run.** As of the last successful audit: `contactlist` = 5 (three bot-like submissions — ids 15, 17, 18); with the DB blind for 42 days, that 5 is a **floor**, not a current value — new spam is invisible. The `posts` table (2 rows) belongs to a *different* project (catherineruiz.com) sharing this Supabase instance; it is NOT part of luis-ruiz. The `rate_limits` table (first seen 2026-07-07) persists empty, unreferenced, no migration — re-confirmed on 2026-08-21 via local `grep` that **no code under `app/`, `lib/`, `components/`, `scripts/`, or `supabase/` references `rate_limits`** (exact match count: 0).
>
> **Code-side inventory (verifiable WITHOUT the DB — re-derived from source this run):** 9 tables appear in direct `.from()` calls — `blog_posts`, `comments`, `contactlist`, `documents`, `gios_context`, `journal`, `projects`, `site_settings`, `todos`. `ADMIN_TABLES` (`lib/admin/config.ts`) registers those 9 plus `votes` = 10. Add the 6 `dashboard_*` tables (addressed dynamically via `lib/supabase/dynamic-table.ts`: `dashboard_clients`, `dashboard_decisions`, `dashboard_leads`, `dashboard_money_entries`, `dashboard_projects`, `dashboard_system_links`) and `user_profiles` (trigger-populated, referenced only in migration `20260627225925_...`, no app-code `.from()`) = **17 luis-ruiz-owned tables** — exactly matching the ACTIVE count in the table below. **No code-side schema drift.**
> ⚠️ Do NOT trust `list_tables` row estimates — they read from stale pg statistics. Always confirm counts with `SELECT count(*)` once the correct project is reconnected.
>
> **There were 19 tables in `public`** at the last successful audit. 17 belong to and are referenced by luis-ruiz app code (ACTIVE). **1 is foreign/externally-owned: `posts`** (catherineruiz.com, managed by a separate Netlify site's service-role functions — leave it alone). **1 is unreferenced and flagged: `rate_limits`** — see the flagged row below and `TABLES_TO_DELETE.md`. It was NOT dropped (intentional-looking scaffolding; see §6).

| Table | Rows | Purpose | Status |
|-------|-----:|---------|--------|
| `blog_posts` | 6 | Public blog/articles | ACTIVE — public read + admin CRUD |
| `projects` | 3 | Public portfolio records | ACTIVE — public read + admin CRUD; sitemap reads `slug`/`visibility` |
| `site_settings` | 1 | Site config (availability, etc.) | ACTIVE — public read + admin CRUD |
| `contactlist` | 5 | Contact-form submissions (sensitive) | ACTIVE — public insert, Gio-only read (3 rows look bot-generated — ids 15, 17 & 18) |
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
| `rate_limits` | 0 | Fixed-window rate limiter (cols: `key` text, `window_start` timestamptz, `hits` int) | ⚠️ UNWIRED — no code references, no migration file (present since 2026-07-07). Likely intentional WIP scaffolding for rate-limiting the contact form or `/api/ai/*`. Flagged, NOT dropped. See `TABLES_TO_DELETE.md`. |
| `posts` | 2 | **FOREIGN** — catherineruiz.com blog posts (bilingual: `title`/`title_es`, `body_md`/`body_md_es`, `published`, `slug`). | 🔵 EXTERNAL — managed exclusively by the `catherine-ruiz-netlify-site` Netlify functions via the service role. NOT part of luis-ruiz and NOT referenced by this codebase. Do not read, write, or drop it from this project. First tracked 2026-07-09 (rows created 2026-07-08 02:41 UTC). |

> `rate_limits` is the only currently-flagged (luis-ruiz-owned) table. `posts` is foreign — it belongs to another site sharing this Supabase project; leave it untouched. If any other table loses all code references, flag it in `TABLES_TO_DELETE.md` (and drop only if empty AND confirmed unintentional).

## 5. Current State of the Project
Working and live in code:
- **Auth:** Supabase SSR auth with Google OAuth, structured logging across the flow, server-side route protection via `proxy.ts` → `lib/supabase/proxy.ts`, and the `(authenticated)` route group enforcing `requireUser()`. Protected prefixes: `/account`, `/dashboard`. `/api/ai/*` enforces `requireApiUser()`.
- **Public site:** Home page (`app/page.tsx`) is **dynamic** — it reads live Supabase data through `lib/public-content/data.ts` (`getHomeContent()`): availability text from `site_settings`, featured `projects`, recent `blog_posts`, plus comment/vote stats. Public projects, blog, and contact pages are wired to their tables.
- **SEO / sitemap:** `app/sitemap.ts` (Next.js metadata route) serves `/sitemap.xml`, revalidated hourly, built by `lib/seo/sitemap.ts`. It emits static public routes plus dynamic `projects` (filtered `visibility='public'`, non-null `slug`) and `blog_posts` rows; private/admin/api routes are excluded by design. A human-readable `/sitemap` page (`app/sitemap/page.tsx`) consumes the same builder. Origin resolution is centralized in `lib/seo/site-url.ts` (env order: `NEXT_PUBLIC_SITE_URL` → `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `https://luis-ruiz.com`). The `/sitemap` link lives in the global footer (`components/navigation/site-footer.tsx`). Guardrail: `scripts/verify-sitemap.mjs` (`npm run test:sitemap`). Full playbook in `docs/sitemap-maintenance.md`.
- **Admin console (`/admin`, Gio-only):** Generic config-driven CRUD over `ADMIN_TABLES` (`lib/admin/config.ts`). Editable: blog_posts, projects, site_settings, journal, todos. Insert-disabled (view/moderate): contactlist, comments, votes. Read-only: documents, gios_context. (The legacy AI inventory/count surface was removed in commit `7b33e4c`.)
- **Dashboard (`/dashboard`, per-user):** Owner-scoped reads through `lib/dashboard/data.ts`, filtered by verified `auth.uid()`.
- **DB security:** RLS hardened across all tables; Gio-admin access gated by `is_gio_admin()` on verified email. Storage: `photos` bucket public (portfolio media), `user_profile_pictures` private (owner-scoped). 13 forward migrations with 8 matching `migrations_down/` rollbacks; the Phase 2 RLS/ownership migration set is committed. NOTE: the `rate_limits` table has NO migration file — it is DB-side drift (see §6/§8).

## 6. Work in Progress
- **`rate_limits` table (unwired, present since 2026-07-07):** A `public.rate_limits` table (`key` text, `window_start` timestamptz, `hits` int) exists in the database — the schema of a classic fixed-window rate limiter. It still has **0 rows (as of 2026-07-10), no code references anywhere, and no migration file**. Strong signal Gio is starting server-side rate-limiting (most plausibly for the public contact form — which took bot-like submissions on 2026-07-05/08/09 — or the `/api/ai/*` routes). Pending steps: (a) capture a forward migration + `migrations_down/` rollback so the table is reproducible, and (b) wire it into the relevant route. Still NOT dropped (see §8). **No progress since it first appeared, 45 days ago.**
- **Hero video asset (committed, still unused):** `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB) was committed to `main` in `2265049` (2026-07-02) but is **still not referenced by any page** (re-verified this run: 0 matches for `hero-bg-lighting` in `app/`, `components/`, `lib/`). Strong signal Gio is about to build a video-background hero on the home page (`app/page.tsx`). The asset is in place; the wiring is the pending step.
- **Obsidian vault untracked (unchanged; re-verified 2026-08-21 — still exactly 6 files):** the notes vault sits at `docs/luis-ruiz-obsidian/luis-ruiz/`, containing `Welcome.md` plus `.obsidian/` state (`app.json`, `appearance.json`, `core-plugins.json`, `graph.json`, `workspace.json`). `git status` shows it as a single untracked entry `?? docs/luis-ruiz-obsidian/`. (History: the 2026-07-11 run wrongly declared this resolved when the *old* path `docs/obsidian/luis-ruiz/` emptied — Gio had **moved/renamed** the vault, not deleted it.) Recommendation stands: add `.obsidian/` (especially `workspace.json`, which churns on every app close) to `.gitignore` before committing the vault, or ignore `docs/luis-ruiz-obsidian/` entirely if it's meant to stay local.
- **Doc-commit backlog keeps growing:** the maintenance-doc edits from the 2026-07-03 through 2026-08-21 runs (`AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, plus `docs/recent-considerations.md`) were **never committed** — they remain uncommitted in the working tree, and this 2026-08-21 run adds to them again. The `2265049` commit (2026-07-02) cleared the previous backlog, but the cycle restarted: the maintenance docs have accrued edits across every run since and remain uncommitted (current diff, `--ignore-all-space`: ~1,737 insertions / 240 deletions across 4 real-content files, plus pure CRLF churn on all 7 `orin-nano/` files). **Note:** the only committed copy of `AGENTS.md` is from 2026-07-02 and is now ~50 days out of date — if the working tree is ever lost, so is a month and a half of briefing. This is the highest-risk item on this list after the Supabase scope.
- **Persistent working-tree noise:** the entire `orin-nano/` folder shows whole-file diffs (line-ending churn — CRLF↔LF normalization, not real content change). Still unresolved — no `.gitattributes` exists yet (re-verified absent this run).

## 7. Recent Changes (Last 24h)
**No commits in the last 24h.** `HEAD` remains `2265049` (2026-07-02 16:39 −0400, ~50 days before this run) — *chore: updated docs*. Branch `main`, exactly level with `origin/main` (`0 ahead / 0 behind`). This is the **thirty-fifth** logged run with no code commits (the 2026-07-31 nightly pass has no log entry — skipped or not saved).

**Nothing changed in application code this run** — no commits, no new/removed tracked files, no working-tree changes beyond the maintenance docs this run itself edits. The project is idle, not broken. This run (2026-08-21 04:05 UTC) followed the previous logged run (2026-08-20 16:05 UTC) after **~12 hours** — back to roughly-nightly spacing, though the run before that sat ~3.5 days out, so cadence remains erratic overall (see the schedule note in the banner). One historical schedule gap also remains (no 2026-07-31 entry).

**Three empty leftover directories deleted 2026-08-21** (first found 2026-07-22; git does not track empty directories, so they stayed invisible in `git status` until removed directly): `app/(authenticated)/admin/legacy-ai/` (residue of commit `7b33e4c`), `app/account/` (residue of the account page's move into the `(authenticated)` route group), and `docs/seo/` (listed in §3 as a docs subfolder since early revisions but always empty). None affected the build; all three are now gone from disk.

**Supabase access still lost (TWENTY-SEVENTH consecutive run) — same hard error, diagnosis settled:**
- The luis-ruiz Supabase project (ref `huyhgdsjpdjzokjwaspb`) remains unreachable. `list_projects` returns only org `chuzvccapvwvbdhmycyr` — three projects: `ghost-ai-ruiztech` (INACTIVE), `razzy-db` (`hswylmfyovrboeorfoqc`), and `sota-board-lake` (`hnaqragfzyvdfwwadghj`). A direct `list_tables` call against `huyhgdsjpdjzokjwaspb` again returned **`MCP error -32600: You do not have permission to perform this action`** — byte-identical for twenty-seven runs running.
- **The control experiment stays retired.** Prior runs proved the token is healthy by reading `sota-board-lake` cleanly while `huyhgdsjpdjzokjwaspb` denied permission — a settled wrong-org-scope diagnosis. The only signal that matters now is whether the target ref itself starts answering; it still does not. Per SKILL Rule #4, Steps 2–4 were skipped. **Consequence:** row counts in §4 are carried forward unverified from 2026-07-10 (now 42 days stale); **nothing was dropped or altered.**
- `sota-board-lake` is **not** connected to luis-ruiz: this repo's `.env.local` points at `huyhgdsjpdjzokjwaspb`, and nothing in `app/`, `lib/`, or `components/` references it. It is tracked here only as the control for the permission diagnosis.

Working tree (uncommitted) at run time:
- The maintenance docs — `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, `docs/recent-considerations.md` — are dirty again (edits from the 2026-07-03 onward runs were never committed; this run adds to them). `git diff --stat --ignore-all-space` reports real changes on exactly these 4 files (total ~1,737 insertions / 240 deletions) — and, once whitespace is ignored, the 7 `orin-nano/` files drop out of the diffstat entirely, confirming their churn is pure CRLF↔LF.
- `?? docs/luis-ruiz-obsidian/` — still untracked, still exactly 6 files (`luis-ruiz/Welcome.md` + 5 `.obsidian/` state files). Unchanged.
- `orin-nano/*` (7 files) shows whole-file line-ending churn only — re-verified this run: with `--ignore-all-space`, **`orin-nano/` does not appear in the diffstat at all**, i.e. zero real changed lines. Direct proof the churn is pure CRLF↔LF normalization. No `.gitattributes` yet. Not touched.
- No application-code changes. `rate_limits` re-confirmed at **exactly 0** code references across `app`/`lib`/`components`/`scripts`/`supabase`. Zero `TODO`/`FIXME`/`HACK` comments in `app`/`lib`/`components`/`scripts`. DB state could not be re-checked (see above).
- **Code-side table inventory re-derived from source this run** (not carried forward): 9 distinct `.from()` targets (`blog_posts`, `comments`, `contactlist`, `documents`, `gios_context`, `journal`, `projects`, `site_settings`, `todos`) + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` (`clients`, `decisions`, `leads`, `money_entries`, `projects`, `system_links`) + `user_profiles` (migration/trigger-only) = **17 luis-ruiz-owned tables**, matching §4 exactly. Migrations re-counted: **13 forward / 8 down**. Hero video: **0** references. **No code-side schema drift.**
- **✅ The NUL-byte corruption issue remains CLOSED.** The 2026-07-16 repair of `AGENTS.md` (127 trailing NUL bytes truncated) has held clean for eighteen consecutive runs. The four root maintenance docs were re-scanned this run with a byte-accurate `tr -cd '\000'` check — **0 real NUL bytes** (AGENTS/MAINTENANCE_LOG/TABLES_TO_DELETE/recent-considerations all clean). (Note: a naive `grep -c $'\x00'` reports false positives because bash collapses `\x00` to an empty pattern that matches every line — use `tr`/`od`, not `grep`, for NUL checks.) No further monitoring.

Recent commits for context:
- `2265049` (2026-07-02 16:39) — *chore: updated docs* — committed accumulated maintenance doc edits + the hero video binary. Current `HEAD`.
- `1e73737` (2026-06-30 15:05) — *chore: updated md file and docs* (a prior maintenance commit).
- `75892c1` (2026-06-29 13:05) — *feat(seo): add public sitemap page and footer link*.
- `7b33e4c` (2026-06-29 07:26) — *chore(admin): remove legacy AI inventory surface* (left the empty `legacy-ai/` dir behind — see above).
- `4c2d3c4` (2026-06-29 07:12) — *feat(admin): add CRUD pages for admin knowledge tables* (journal, todos, documents, gios_context surfaced in admin).

The six previously-orphaned AI/join tables (`conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`, `round_robin_messages`, `project_blog_links`) were dropped in an earlier run and remain gone; the dead AI helper RPCs (`match_chat_embeddings`/`match_chat_messages`/`get_next_chat_id`/`next_chat_id`) also remain gone — only `match_documents` and `match_gios_context` exist.

## 8. Known Issues / Open Questions
- **⚠️ Supabase MCP is scoped to the WRONG ORG (27th run in a row; first seen 2026-07-11).** The MCP token in use only sees org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech`, `razzy-db`, `sota-board-lake`). This project's DB `huyhgdsjpdjzokjwaspb` (`luis-ruiz`) is under a **different account/org**: a direct `list_tables` call against it returns **`permission denied`** (MCP error -32600), identically on twenty-seven consecutive runs. **The token itself is provably fine** — prior runs (2026-07-14 through 2026-07-17) read `sota-board-lake` without error; that control test is retired as settled. So this is purely an org-scoping problem; it is not an expired credential, not an outage, and it will not self-heal. Nightly DB audits cannot run and §4 counts are going stale (42 days and counting). **This is the single highest-value thing for Gio to fix** — everything else in the DB audit (spam rows, `rate_limits`, orphan detection) is blocked behind it. ACTION FOR GIO: authorize the Supabase account/org that owns `huyhgdsjpdjzokjwaspb` for the maintenance agent's Supabase MCP (or move/invite the project into `chuzvccapvwvbdhmycyr`). Until then, treat all §4 numbers as last-known floors (2026-07-10).
- **⚠️ `MAINTENANCE_LOG.md` is now ~151 KB of near-duplicate entries.** Thirty-plus consecutive runs have appended an entry saying substantially the same thing ("no commits, DB unreachable, docs dirty"). The signal-to-noise ratio is poor and the file grows ~1–2 KB/run for as long as the project stays idle. The last several runs deliberately wrote **short** entries. ACTION FOR GIO: consider archiving entries older than ~14 days into `docs/maintenance-archive/` and/or dropping the agent to weekly while the repo is idle.
- **Three empty leftover directories (found 2026-07-22) — RESOLVED 2026-08-21:** `app/(authenticated)/admin/legacy-ai/`, `app/account/`, and `docs/seo/` were deleted. They had been harmless to the build and invisible to git, but had made §3's structure map inaccurate for weeks (notably: `/account` was described as a public route when it was an empty folder).
- **Obsidian vault untracked (unchanged)** — `docs/luis-ruiz-obsidian/` is untracked and contains volatile `.obsidian/` state files (`workspace.json` rewrites on every Obsidian close). Decide: `.gitignore` the `.obsidian/` subdirectory and commit the notes, or ignore the whole vault path. Leaving it untracked means every nightly run reports it as drift.
- **`README.md` is still stock `create-next-app` boilerplate** (1,450 bytes, untouched since 2026-06-17) — it says nothing about luis-ruiz, Supabase, the env vars, or the admin/dashboard split. It is the first file any human or LLM lands on, and it teaches them nothing. `AGENTS.md` §10 already holds the real run instructions; a 20-line real README would fix this.
- **`rate_limits` = untracked DB drift** — a table exists in the database with no corresponding migration file and no code references. Two risks: (1) it is not reproducible from `supabase/migrations/` (a fresh environment won't have it), and (2) if it turns out to be an accidental leftover it should be dropped. Because it is empty AND its schema looks deliberate (fixed-window limiter), the maintenance agent **flagged rather than dropped** it. ACTION FOR GIO: confirm it's intentional, then either capture a migration (+ down-migration) or `DROP TABLE public.rate_limits;`.
- **Committed-but-unused hero video** — `public/videos/hero-bg-lighting-1.mp4` (~2.7 MB) is committed to `main` (in `2265049`) but still not referenced by any page. The 2.7 MB binary now lives in git history permanently (acceptable but not ideal — Git LFS or Supabase Storage/CDN would have been cleaner). Remaining work: wire it into the home hero (`app/page.tsx`), or remove it if abandoned.
- **`orin-nano/` whole-file diffs** — every file shows massive equal insert/delete churn, which is line-ending/encoding normalization (CRLF↔LF), not real content change. Add a `.gitattributes` (e.g. `* text=auto eol=lf`) to stop the noise, then commit the normalization once. **STILL UNRESOLVED — the oldest open item in this file.**
- **Contact-form spam is recurring (and now UNOBSERVABLE)** — as of the last successful audit, THREE `contactlist` rows were throwaway-alias gmails with bot-like patterns: id 15 (`y.uzo.xe.t.i.h.ix.96@gmail.com`, 2026-07-05), id 17 (`l.il.i.y.a.vi.l.l.ar@gmail.com`, 2026-07-08), id 18 (`turnerfish.er348382+scot.stjohn@gmail.com`, 2026-07-09 — a `+`-alias variant). Three hits in five days; the form is being actively hit by a bot. **With the DB blind since 2026-07-10, any spam that arrived in the last 42 days is invisible to this audit** — at the observed cadence (~1 every 2 days) expect roughly 20+ more rows waiting. Prioritize wiring the `rate_limits` table (or a captcha/honeypot) into the contact form, and moderate/delete the spam rows.
- **Foreign `posts` table in the shared DB** — a `posts` table for catherineruiz.com lives in this Supabase project, managed by an external Netlify site's service-role functions. It is not a luis-ruiz table. Risk: a future migration or cleanup pass could accidentally touch it. Do NOT read/write/drop it from this codebase. (RLS should keep it isolated; worth confirming this project's `is_gio_admin()`/RLS doesn't grant unintended access to it.)
- **Public content is thin** — `projects` (3) and `blog_posts` (6) have content, but `dashboard_*` working tables and `comments`/`votes` are mostly empty.
- **Hosting not confirmed live** — Vercel deploy intended; set `NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com` in production so the sitemap emits absolute production URLs (not localhost/fallback).
- No `TODO`/`FIXME`/`HACK` comments found in `app`, `lib`, `components`, or `scripts` (re-verified: 0 matches).

## 9. Next Steps
Most likely next actions for Gio:
0. **Fix the Supabase org scope for the maintenance agent — 27 runs blind, and it will not self-heal.** The nightly DB audit cannot run until the account/org owning `huyhgdsjpdjzokjwaspb` is authorized to the Supabase MCP. The agent can currently see only org `chuzvccapvwvbdhmycyr` and reads those projects fine — so the connection works; it is pointed at the wrong org. Do this first — steps 1 and 4 below both depend on DB visibility.
1. **Finish the `rate_limits` feature:** wire the table into a rate-limiting check (contact form and/or `/api/ai/*`), and capture a forward migration + `migrations_down/` rollback so the DB stays reproducible. Right now it's an orphaned, untracked table.
2. **Wire `public/videos/hero-bg-lighting-1.mp4` into the home hero (`app/page.tsx`)** as a background video — the asset is committed and waiting.
3. **Housekeeping pass — DONE 2026-08-21:** `.gitattributes` added, the seven-week maintenance backlog committed, the three empty leftover directories deleted, the Obsidian vault notes committed (with `.obsidian/` state ignored), and `README.md` replaced with a real install guide. See the commit history for details.
4. **Anti-spam on the contact form (higher priority — spam is escalating and now unobserved).** Three bot-like submissions in five days (ids 15, 17, 18) before the DB went dark. Wire the `rate_limits` table (and/or a honeypot/captcha) into `app/contact/actions.ts`, and delete/moderate the spam rows once DB access returns.
5. Populate public pages with real `projects`/`blog_posts` content.
6. Configure production hosting (Vercel) and `NEXT_PUBLIC_SITE_URL`; verify `/sitemap.xml` serves absolute production URLs and submit to Google Search Console.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
# Production SEO (set in prod so the sitemap emits absolute URLs):
NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com
```

## 11. Conventions & Preferences
- Gio prefers modular code with strict separation of concerns ("respect separation of concerns to the 'T'"). Keep per-domain logic in its own `lib/<domain>/` folder with thin `data.ts` (reads) / `mutations.ts` (writes) splits, mirroring the existing `admin`/`dashboard`/`public-content` structure. Per-table admin logic follows a further `{actions,queries,types}.ts` triple (see `lib/admin/journal/`).
- TypeScript throughout; validate external input with `zod`.
- Server identity always comes from the verified JWT (`getClaims()` / `requireUser()` / `requireApiUser()`), never from client or route params. Admin = verified email via `is_gio_admin()`, never a stored role.
- Every DB table has RLS enabled; new tables must ship with RLS policies AND a migration + matching `migrations_down/` rollback. (The `rate_limits` table currently violates the migration rule — see §8.)
- This is a non-standard Next.js `16.2.9` build — consult `node_modules/next/dist/docs/` before using framework APIs.
- Admin/dashboard CRUD is config-driven: register a table in `lib/admin/config.ts` (`ADMIN_TABLES`) rather than hand-building pages. Dashboard tables are addressed dynamically via `lib/supabase/dynamic-table.ts`.
