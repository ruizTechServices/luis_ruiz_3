# Recent Considerations

Last verified: 2026-06-28

> ⚠️ **PARTIALLY STALE (flagged 2026-07-01 by nightly maintenance).** The tables
> in the "Current Frontend Usage" / access-model tables below that list
> `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`,
> `round_robin_messages`, and `project_blog_links` (with row counts and "keep
> for future" guidance) are **OUT OF DATE** — all six of those tables have since
> been **DROPPED** from the project (see the "DROPPED" note lower in this file
> and `AGENTS.md` §4). The RPC rows for `match_chat_embeddings(...)` and
> `match_chat_messages(...)` are also OUT OF DATE — as of 2026-07-02 those
> functions (plus `get_next_chat_id()`/`next_chat_id()`) have themselves been
> DROPPED from the DB and no longer exist; only `match_documents(...)` and
> `match_gios_context(...)` remain.
> **UPDATE 2026-07-09:** the `public` schema now has **19 tables**. Two are not
> in the matrix below: (1) `rate_limits` (fixed-window limiter:
> `key`/`window_start`/`hits`) — empty, unreferenced by code, no migration yet
> (flagged in `TABLES_TO_DELETE.md`); and (2) `posts` — a **FOREIGN** table for
> catherineruiz.com, managed by an external Netlify site's service-role
> functions, NOT part of luis-ruiz and not referenced by this codebase (leave it
> alone). So "17 active tables" below refers only to luis-ruiz-owned tables and
> is otherwise stale. Also note `contactlist` is now 4 rows (two look like bot
> spam). **For the authoritative current schema, read `AGENTS.md` §4 — it is
> regenerated nightly. Treat this file as historical analysis, not current
> truth.**
> **UPDATE 2026-07-11:** the `luis-ruiz` Supabase project (`huyhgdsjpdjzokjwaspb`)
> was **not reachable** by the nightly maintenance agent this run — the connected
> Supabase account only exposed unrelated projects (`ghost-ai-ruiztech`,
> `razzy-db`). No schema/row numbers were re-verified on 2026-07-11; AGENTS.md §4
> counts are carried forward from 2026-07-10 and may be stale until the correct
> Supabase account is reconnected. This document remains historical analysis.
> **UPDATE 2026-07-12:** still not reachable — **second consecutive run**. A direct
> `list_tables` call against `huyhgdsjpdjzokjwaspb` returned *"You do not have
> permission to perform this action"*, confirming the connected Supabase token
> lacks access to the project (rather than the project being gone). **The last
> verified DB snapshot for this project is now 2026-07-10.** Every row count in
> this file AND in `AGENTS.md` §4 should be treated as a floor, not a current
> value — new rows (e.g. further contact-form spam) would not have been detected.

This is a visibility map for the `luis-ruiz` Supabase project. It answers who
can view what today and what future frontend work should assume.

## Access Model

Personas:

- Public user: anonymous visitor using the Supabase anon role.
- Signed-up user: any authenticated user other than `giosterr44@gmail.com`.
- Gio admin: authenticated Google OAuth user with verified email
  `giosterr44@gmail.com`.

Admin authority is stateless and based on the verified Supabase auth email via
`public.is_gio_admin()`. Do not make admin decisions from `user_profiles.role`.

In this document, "view" means database-visible through Supabase grants and RLS,
plus the current frontend route model. Some tables have broad SQL grants to
`authenticated`, but RLS is the actual row-level gate.

## Current Frontend Usage

- `lib/dashboard/data.ts` reads only the `dashboard_*` tables and filters by the
  verified user id.
- Current Orin chat persistence uses browser IndexedDB through
  `lib/browser-db/*`; no current app code reads Supabase `conversations`,
  `chat_messages`, or `chat_embeddings`.
- No current app code uses Supabase Storage APIs.
- **[Updated 2026-06-28 by maintenance agent]** `app/page.tsx` is **no longer
  static**. As of commit `05c576a` it reads live Supabase data through
  `lib/public-content/data.ts` → `getHomeContent()` (availability text from
  `site_settings`, featured `projects`, recent `blog_posts`). The public
  projects/blog/contact pages are now wired to these tables as well. The
  remainder of this document's access/visibility analysis still holds.

## Table Visibility Matrix

| Table | Purpose | Total rows | Public user view | Signed-up non-Gio view | Gio admin view | Writes | Current/future note | Deletion/archive consideration |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| `projects` | Public portfolio/case-study records | 3 | 3 rows | 3 rows | 3 rows | Gio-only create/update/delete | Future portfolio pages should read from this table. | Keep. Core public content table. |
| `blog_posts` | Public blog/article records | 6 | 6 rows | 6 rows | 6 rows | Gio-only create/update/delete | Future blog pages should read directly or through `get_blog_posts_with_stats()`. | Keep. Core public content table. |
| `project_blog_links` | Join table between projects and blog posts | 0 | 0 rows | 0 rows | 0 rows | Gio-only create/update/delete | Future project/blog cross-linking table. | Keep for future linking even though empty. |
| `site_settings` | Public site-level settings such as availability | 1 | 1 row | 1 row | 1 row | Gio-only create/update/delete | Future homepage/nav settings can use this. | Keep. Small config table. |
| `comments` | Public visible blog comments | 0 | 0 rows | 0 rows | 0 rows | Authenticated insert matching `auth.email()`; Gio-only moderation update/delete | Future blog engagement table. | Keep as future-facing unless comments are explicitly removed from product direction. |
| `votes` | Public visible blog votes | 0 | 0 rows | 0 rows | 0 rows | Authenticated insert matching `auth.email()`; Gio-only moderation update/delete | Future voting/engagement table. | Keep as future-facing unless voting is removed from product direction. |
| `contactlist` | Contact form submissions | 2 | No select; insert probe passed | 0 visible rows | 2 rows | Public/auth insert; Gio-only select/update/delete | Use for contact intake. Do not render submissions to non-admin users. | Keep. Sensitive intake data. |
| `documents` | Admin vector/document knowledge base | 1 | No access | 0 rows | 1 row | Gio-only all row operations | Used by `match_documents()` for admin-only retrieval. | Keep unless the vector/document feature is retired. |
| `gios_context` | Gio-specific context/memory vectors | 26 | No access | 0 rows | 26 rows | Gio-only all row operations | Used by `match_gios_context()` for admin-only retrieval. | Keep unless the Gio context feature is retired. |
| `journal` | Personal journal, currently Gio-only | 54 | No access | 0 rows | 54 rows | Gio-only all row operations | Not referenced by current app code. | Strong review candidate. Export/archive before any deletion decision. |
| `todos` | Personal todos, currently Gio-only | 54 | No access | 0 rows | 54 rows | Gio-only all row operations | Not referenced by current app code. | Strong review candidate. Export/archive before any deletion decision. |
| `dashboard_projects` | Authenticated user-owned dashboard projects | 0 | No access | 0 rows for sampled non-Gio user | 0 rows for Gio | Owner-scoped authenticated CRUD | Current dashboard reads counts from this table. | Keep. Owner-scoped product surface. |
| `dashboard_clients` | Authenticated user-owned clients | 0 | No access | 0 rows for sampled non-Gio user | 0 rows for Gio | Owner-scoped authenticated CRUD | Current dashboard reads counts from this table. | Keep. Owner-scoped product surface. |
| `dashboard_leads` | Authenticated user-owned leads | 0 | No access | 0 rows for sampled non-Gio user | 0 rows for Gio | Owner-scoped authenticated CRUD | Current dashboard reads counts from this table. | Keep. Owner-scoped product surface. |
| `dashboard_money_entries` | Authenticated user-owned financial entries | 0 | No access | 0 rows for sampled non-Gio user | 0 rows for Gio | Owner-scoped authenticated CRUD with project/client ownership checks | Current dashboard reads counts from this table. | Keep. Owner-scoped product surface. |
| `dashboard_decisions` | Authenticated user-owned decisions | 4 | No access | 0 rows for non-Gio | **4 rows for Gio (fixed 2026-06-28)** | Owner-scoped authenticated CRUD with project ownership checks | Current dashboard reads counts from this table. | Keep. Ownership backfilled to Gio — see note below. |
| `dashboard_system_links` | Authenticated user-owned system links | 9 | No access | 0 rows for non-Gio | **9 rows for Gio (fixed 2026-06-28)** | Owner-scoped authenticated CRUD | Current dashboard reads counts from this table. | Keep. Ownership backfilled to Gio — see note below. |
| `user_profiles` | Auth user profile rows | 19 | No access | Own profile only; sampled non-Gio saw 1 row | Own profile only; Gio saw 1 row | Authenticated users may update safe profile fields only | Trigger-created on signup through `handle_new_user()`. | Keep. Auth/profile backbone. |
| `conversations` | Legacy/server-side AI conversation records | 32 | No access | Owner rows only; sampled non-Gio saw 0 | Owner rows only; Gio saw 32 | Owner-scoped authenticated CRUD | Current app appears to use browser IndexedDB instead. | Future/uncertain candidate. Confirm whether legacy AI data should be migrated, archived, or revived. |
| `chat_messages` | Legacy/server-side AI chat messages | 28 | No access | Owner rows only; sampled non-Gio saw 0 | Owner rows only; Gio saw 28 | Owner-scoped authenticated CRUD | Current app appears to use browser IndexedDB instead. | Future/uncertain candidate. Keep until AI persistence direction is decided. |
| `chat_embeddings` | Legacy/server-side AI chat embeddings | 18 | No access | Owner rows only; sampled non-Gio saw 0 | Owner rows only; Gio saw 18 | Owner-scoped authenticated CRUD | Used by `match_chat_embeddings()` if server-side chat memory is revived. | Future/uncertain candidate. Keep until AI persistence direction is decided. |
| `round_robin_sessions` | Legacy/future multi-model AI sessions | 27 | No access | Owner rows only; sampled non-Gio saw 0 | Owner rows only; Gio saw 0 | Owner-scoped authenticated CRUD | Not referenced by current app code. | Future/uncertain candidate. Determine whether this feature is still planned before deleting. |
| `round_robin_messages` | Messages belonging to round-robin sessions | 154 | No access | Owner rows only through owned sessions; sampled non-Gio saw 0 | Owner rows only through owned sessions; Gio saw 0 | Owner-scoped through parent session ownership | Not referenced by current app code. | Future/uncertain candidate. Archive with sessions if retired. |

## Storage Visibility

| Bucket | Objects | Public user view | Signed-up non-Gio view | Gio admin view | Writes | Note |
| --- | ---: | --- | --- | --- | --- | --- |
| `photos` | 9 | Public bucket URL access; no broad object-listing policy | Same public URL access | Same public URL access | Gio-only object insert/update/delete | Good fit for public portfolio media. Do not add list access unless the UI truly needs it. |
| `user_profile_pictures` | 1 | No public bucket access | Owner-scoped object access only | Owner-scoped object access only | Owner-scoped object insert/update/delete | Bucket is private. Future profile upload UI must save objects under the authenticated owner. |

## RPC And Function Visibility

| Function | Public user | Signed-up non-Gio user | Gio admin | Notes |
| --- | --- | --- | --- | --- |
| `get_blog_posts_with_stats()` | Execute allowed | Execute allowed | Execute allowed | Public blog read helper. |
| `is_gio_admin()` | No execute | Execute allowed, returns false for non-Gio | Execute allowed, returns true for Gio | Authenticated-only helper for policies and checks. |
| `match_chat_embeddings(...)` | No execute | Execute allowed, owner-scoped by `auth.uid()` | Execute allowed, owner-scoped by `auth.uid()` | Future/legacy chat memory search. |
| `match_chat_messages(...)` | No execute | Execute allowed, owner-scoped by `auth.uid()` | Execute allowed, owner-scoped by `auth.uid()` | Future/legacy chat memory search. |
| `match_documents(...)` | No execute | Execute allowed but returns no rows unless Gio | Execute allowed and can return admin documents | Admin-only retrieval through function predicate and table RLS. |
| `match_gios_context(...)` | No execute | Execute allowed but returns no rows unless Gio | Execute allowed and can return Gio context | Admin-only retrieval through function predicate and table RLS. |
| `handle_new_user()` | No execute | No execute | No execute | Trigger function only; should stay off public RPC surface. |
| `get_next_chat_id()` / `next_chat_id()` | No execute | No execute | No execute | No current app references found. Consider removal only after confirming no legacy callers. |
| `set_updated_at()` / `update_updated_at_column()` | No execute | No execute | No execute | Trigger/helper functions only. |

## Deletion And Archive Considerations

These are not approvals to delete. They are candidates to review before future
schema cleanup.

- Strong review: `journal` and `todos`. Each has 54 rows, is Gio-only, and is
  not referenced by the current app. Export or archive before deletion.
- Ownership (RESOLVED 2026-06-28): `dashboard_decisions` (4 rows) and
  `dashboard_system_links` (9 rows) were seeded on 2026-05-20 with
  `user_id = NULL`, before the `user_id default auth.uid()` ownership column was
  added (2026-06-26). RLS gates on `(select auth.uid()) = user_id`, so NULL-owner
  rows were invisible to Gio's session. Migration
  `20260628122120_backfill_orphaned_dashboard_ownership.sql` set those rows'
  `user_id` to Gio's verified uid `f6794b1c-0ed7-4f3c-9cad-9c2776de83e4`; all 13
  rows are now Gio-owned and visible. Future seeds into `dashboard_*` tables must
  set `user_id` explicitly (service-role inserts bypass the `auth.uid()` default
  and would re-orphan rows).
- Future/uncertain: `conversations`, `chat_messages`, `chat_embeddings`,
  `round_robin_sessions`, and `round_robin_messages`. These contain data but
  are not used by the current app path. Keep until the AI persistence direction
  is decided.
- Likely keep as future-facing: `comments`, `votes`, and `project_blog_links`.
  They are empty now, but match plausible blog/portfolio engagement and linking
  features.
- Storage: keep `photos` public for media URLs and keep
  `user_profile_pictures` private. Do not add public listing unless
---

## [2026-06-29 maintenance update] Admin surfacing corrections

The visibility/access analysis above still holds at the database (grants + RLS)
level, but several "not referenced by current app code" notes are now **stale**.
As of the current codebase these tables ARE referenced by the admin interface:

- `journal` and `todos` — now have admin CRUD pages (`/admin/journal`,
  `/admin/todos`) and entries in `lib/admin/config.ts` (`ADMIN_TABLES`). No
  longer "not referenced by current app code."
- `documents` and `gios_context` — now surfaced read-only in the admin console
  (`/admin/documents`, `/admin/gios-context`, `readOnly: true`).
- `conversations`, `chat_messages`, `chat_embeddings`, `round_robin_sessions`,
  `round_robin_messages` are not referenced by the active app after removal of
  the admin count-only viewer. They are back in `TABLES_TO_DELETE.md` for an
  export-then-drop cleanup decision. The current Orin chat path uses IndexedDB
  in `lib/browser-db/*`.

Row counts were re-verified live on 2026-06-29 with exact `COUNT(*)` and match
the figures in the matrix above (e.g. `journal` 54, `todos` 54,
`gios_context` 26, `round_robin_messages` 154). Note: Supabase `list_tables`
row ESTIMATES are unreliable here — they reported 0 for every table this run.

The only remaining orphaned table is `project_blog_links` (0 rows, no code
refs), still kept as future-facing per the deletion notes above.

---

## [2026-06-30 maintenance update] Dropped tables — matrix rows now stale

**Six tables in the matrix above no longer exist.** They were dropped from the
Supabase project (`huyhgdsjpdjzokjwaspb`) since the 2026-06-29 update. The
`public` schema now contains exactly **17 tables, all ACTIVE** (re-verified live
with exact `COUNT(*)` on 2026-06-30). The following matrix/RPC rows are
**historical only** and should be ignored as current state:

- `conversations`, `chat_messages`, `chat_embeddings`,
  `round_robin_sessions`, `round_robin_messages` — r
---

## [2026-07-13 maintenance update] DB unreachable for a THIRD run — counts now 3 days stale

The Supabase project `huyhgdsjpdjzokjwaspb` was again not reachable through the
maintenance agent's MCP connection. A direct `list_tables` call against the ref
returned `MCP error -32600: You do not have permission to perform this action` —
byte-identical to the 2026-07-12 run. Three consecutive identical failures means
this is a **stable authorization gap** (the token isn't scoped to the org that
owns the project), not a flaky connection. It will not fix itself.

Consequences for anyone reading this file:
- **The last authoritative row counts are from 2026-07-10.** Treat every count in
  the matrix above and in `AGENTS.md` §4 as a **floor**, not a current value.
- New contact-form spam since 2026-07-10 is **invisible** — `contactlist` = 5 is a
  floor. The form has been taking bot submissions roughly every 2-3 days.
- No orphan detection, no drops, no schema verification happened on 2026-07-11,
  -07-12, or -07-13.

The code-side inventory *was* re-verified without the DB and shows **no drift**:
9 tables in direct `.from()` calls + `votes` (registered in `ADMIN_TABLES`) + 6
`dashboard_*` tables (addressed via `lib/supabase/dynamic-table.ts`) +
`user_profiles` = **17 luis-ruiz-owned tables**, exactly matching the last verified
ACTIVE count. So the schema is very likely unchanged; we simply can't prove it.

Fix: re-authorize the Supabase account/org that owns `huyhgdsjpdjzokjwaspb` for the
maintenance agent's Supabase MCP. Everything else in the DB audit is blocked on it.

---

## [2026-07-14] Supabase DB unreachable — 4th run. Now definitively an ORG-SCOPE problem.

Fourth consecutive nightly run with no DB access. `list_tables` against
`huyhgdsjpdjzokjwaspb` returned `MCP error -32600: You do not have permission to
perform this action` — byte-identical to 2026-07-12 and 2026-07-13.

**New evidence that settles the diagnosis.** A brand-new project appeared inside the
org the agent *can* see (`chuzvccapvwvbdhmycyr`): **`sota-board-lake`**, ref
`hnaqragfzyvdfwwadghj`, us-east-1, ACTIVE_HEALTHY, created **2026-07-13 20:24 UTC**
(~8h before this run). The agent enumerated its schema with **zero errors** — one
table, `public.prompt_submissions`, 3 rows, RLS enabled.

That rules out every alternative explanation:
- Not an expired/invalid token — it authenticated and read a project fine.
- Not a Supabase outage — a project in the visible org responded normally.
- Not a moved/deleted project — the permission error implies it exists.

**It is purely an org-scoping gap:** `huyhgdsjpdjzokjwaspb` (luis-ruiz) lives under a
different Supabase account/org than the one the maintenance agent's MCP token is
bound to. Fix = authorize that org (or move/invite the project into
`chuzvccapvwvbdhmycyr`). Nothing else unblocks the nightly DB audit.

Note: `sota-board-lake` is **not** part of luis-ruiz — this repo's `.env.local` points
at `huyhgdsjpdjzokjwaspb`, and no code here references `prompt_submissions`. It is
recorded only because it was the sole observable change anywhere this run, and
because it is what proved the token healthy.

Everything else is unchanged: 12th straight run with no commits (HEAD still
`2265049`, 2026-07-02); working tree byte-identical to the last two runs; code-side
inventory still reconciles to **17 luis-ruiz-owned tables** with no drift; all row
counts still carried forward from **2026-07-10 (now 4 days stale — treat as floors)**.

---

## 2026-07-16 — Fifth consecutive DB lockout; control test repeated

Ran the same control experiment as 2026-07-14, and it produced the same result:

- `list_tables` on `huyhgdsjpdjzokjwaspb` (luis-ruiz, from `.env.local`) →
  **`MCP error -32600: You do not have permission to perform this action`**
- `list_tables` on `hnaqragfzyvdfwwadghj` (`sota-board-lake`, in the visible org
  `chuzvccapvwvbdhmycyr`) → **succeeded**: `public.prompt_submissions`, 3 rows, RLS on
  — byte-identical to 2026-07-14.

Two successful reads on two consecutive nights, against a token that denies luis-ruiz,
settles it beyond argument: the Supabase MCP credential is valid and Supabase is up.
`huyhgdsjpdjzokjwaspb` lives under an org this token cannot see. **Fix = authorize the
owning org, or move/invite the project into `chuzvccapvwvbdhmycyr`.** No debugging.

Everything else is static: 13th straight run with no commits (HEAD still `2265049`,
2026-07-02, ~13.4 days back); working tree byte-identical to the last three runs;
`sota-board-lake` itself unchanged; code-side inventory still reconciles to **17
luis-ruiz-owned tables** with no drift; all row counts still carried forward from
**2026-07-10 (now 5+ days stale — treat as floors)**.

Cost of the blind spot is compounding in exactly one place: contact-form spam. At the
last observed cadence (~1 bot row every 2 days, last seen id 18 on 2026-07-09), roughly
**3 unseen rows** are likely sitting in `contactlist` now.

---

## 2026-07-16 (04:04 UTC) — Sixth consecutive DB lockout; control test repeated a third time

Second maintenance run of 2026-07-16 (the previous one fired at 01:21 UTC, ~2h45m
earlier). Same control experiment, same result for the third night running:

- `list_tables` on `huyhgdsjpdjzokjwaspb` (luis-ruiz, from `.env.local`) →
  **`MCP error -32600: You do not have permission to perform this action`**
- `list_tables` on `hnaqragfzyvdfwwadghj` (`sota-board-lake`, in the visible org
  `chuzvccapvwvbdhmycyr`) → **succeeded**: `public.prompt_submissions`, 3 rows, RLS on
  — byte-identical to 2026-07-14 and to the 01:21 run.

Three successful control reads against a token that denies luis-ruiz. There is nothing
left to diagnose. **Fix = authorize the org that owns `huyhgdsjpdjzokjwaspb`, or
move/invite that project into `chuzvccapvwvbdhmycyr`.**

Everything else is static: 14th straight run with no commits (HEAD still `2265049`,
2026-07-02, ~13.3 days back); working tree byte-identical to the last four runs
(`git diff --numstat` on `orin-nano/*` shows the same equal-insert/delete CRLF churn:
413/413, 686/686, 2301/2301, 614/614, 116/116, 130/130, 1488/1488); code-side inventory
still reconciles to **17 luis-ruiz-owned tables** with no drift; all row counts still
carried forward from **2026-07-10 (now 6 days stale — treat as floors)**.

Verification pass this run: re-scanned every tracked `.md` for NUL corruption (the
`AGENTS.md` padding repaired on 2026-07-16 01:21) — **all clean, including AGENTS.md**,
so that fix held. Re-confirmed all 12 file paths cited across the docs still exist, and
migration counts still read 13 forward / 8 down.

---

## 2026-07-17 (04:05 UTC) — Seventh consecutive DB lockout; control test repeated a fourth time

Single run tonight at 04:05 UTC — the 2026-07-16 double-run anomaly (01:21 + 04:04) did
**not** recur, so the cadence is back to normal.

Same control experiment, same result for the fourth night running:

- `list_tables` on `huyhgdsjpdjzokjwaspb` (luis-ruiz, from `.env.local`) →
  **`MCP error -32600: You do not have permission to perform this action`**
- `list_tables` on `hnaqragfzyvdfwwadghj` (`sota-board-lake`, in the visible org
  `chuzvccapvwvbdhmycyr`) → **succeeded**: `public.prompt_submissions`, 3 rows, RLS on
  — byte-identical to 2026-07-14 and to both 2026-07-16 runs.

Four successful control reads against a token that denies luis-ruiz. Nothing left to
diagnose; the finding has been stable for seven runs. **Fix = authorize the org that owns
`huyhgdsjpdjzokjwaspb`, or move/invite that project into `chuzvccapvwvbdhmycyr`.**

Everything else is static: 15th straight run with no commits (HEAD still `2265049`,
2026-07-02, ~14.5 days back); working tree byte-identical to the last five runs
(`git diff --numstat` on `orin-nano/*` shows the same equal-insert/delete CRLF churn:
413/413, 686/686, 2301/2301, 614/614, 116/116, 130/130, 1488/1488); code-side inventory
still reconciles to **17 luis-ruiz-owned tables** with no drift; all row counts still
carried forward from **2026-07-10 (now 7 days stale — treat as floors)**.

Verification pass this run: re-scanned every tracked `.md` for NUL corruption — **all 15
files clean, 0 NUL bytes**. That is two consecutive clean runs since the 2026-07-16 01:21
repair of `AGENTS.md`, so **the corruption item is now CLOSED** — it was a one-off write
artifact, not a recurring process. Re-confirmed all 12 file paths cited across the docs
still exist, and migration counts still read 13 forward / 8 down.

Note on the SKILL file: its Step 2 grep example points at `...\luis-ruiz\luis_ruiz_2`
(this project is `luis_ruiz_3`). Every run has silently corrected for it; worth fixing in
the task definition so a future agent doesn't grep an unrelated tree.

---

## 2026-07-18 04:05 UTC — 8th blind run; control test retired; NUL false-alarm caught

`list_tables` against `huyhgdsjpdjzokjwaspb` again returned `MCP error -32600: permission
denied` — **eighth consecutive run**. The wrong-org-scope diagnosis is settled (four prior
control reads of `sota-board-lake` all succeeded), so **the control test is now retired** —
re-reading a healthy project nightly just to re-prove a known fact was wasting a run each
time. The only thing worth watching now is whether the target ref itself starts answering;
it still doesn't. Fix remains a one-liner: authorize the org that owns `huyhgdsjpdjzokjwaspb`.

Everything static again: **16th** straight run with no commits (HEAD still `2265049`,
2026-07-02, ~15.5 days back); working tree byte-identical to the last six runs (same
`orin-nano/*` CRLF churn: 413/413, 686/686, 2301/2301, 614/614, 116/116, 130/130,
1488/1488); code-side inventory still reconciles to **17 luis-ruiz-owned tables**, no drift;
row counts still carried forward from **2026-07-10 (now 8 days stale — floors)**.

**Verification-tooling correction:** this run's first NUL scan used `grep -c $'\x00'`, which
reported hundreds of "matches" in every `.md` file. That is a **false positive** — bash
collapses `\x00` to an empty string, so the pattern matches every line. A byte-accurate
re-check with `tr -cd '\000' | wc -c` confirmed **0 real NUL bytes in all files**. The NUL
item stays CLOSED; future runs should use `tr`/`od`, never `grep`, for NUL checks. All 12
cited file paths still exist; migration counts still 13 forward / 8 down.

---

## 2026-07-19 04:08 UTC — 9th blind run; nothing new to diagnose

`list_tables` against `huyhgdsjpdjzokjwaspb` again returned `MCP error -32600: permission
denied` — **ninth consecutive run**. `list_projects` still exposes only org
`chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`). The
wrong-org-scope diagnosis remains settled; the control test stays retired. The only signal
worth watching — whether the target ref itself starts answering — is still negative. Fix
remains a one-liner: authorize the org that owns `huyhgdsjpdjzokjwaspb` (or move/invite that
project into `chuzvccapvwvbdhmycyr`).

Everything static again: **17th** straight run with no commits (HEAD still `2265049`,
2026-07-02, ~16.5 days back); working tree byte-identical to the last seven runs (same
`orin-nano/*` CRLF churn: 413/413, 686/686, 2301/2301, 614/614, 116/116, 130/130,
1488/1488); code-side inventory still reconciles to **17 luis-ruiz-owned tables**, no drift;
`rate_limits` still has zero code references; row counts still carried forward from
**2026-07-10 (now 9 days stale — floors)**. Verification pass: all tracked `.md` files
re-scanned with `tr -cd '\000'` → **0 NUL bytes**; NUL item stays CLOSED. 0 TODO/FIXME/HACK
comments in `app`/`lib`/`components`/`scripts`. Contact-form spam remains the one compounding
cost of the blind spot: at ~1 bot row every 2 days (last seen id 18 on 2026-07-09), roughly
4–5 unseen `contactlist` rows are likely waiting.

---

## 2026-07-21 04:09 UTC — 10th blind run; a skipped night, and a note on log bloat

`list_tables` against `huyhgdsjpdjzokjwaspb` returned `MCP error -32600: permission denied`
for the **tenth consecutive run**. `list_projects` still exposes only org
`chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Wrong-org-scope diagnosis settled; control test stays retired. Fix is unchanged and still a
one-liner: authorize the org that owns `huyhgdsjpdjzokjwaspb`, or move/invite that project
into `chuzvccapvwvbdhmycyr`.

**New this run: no maintenance run happened on 2026-07-20.** `MAINTENANCE_LOG.md` jumps
straight from 2026-07-19 04:08 to 2026-07-21 04:09. This is the second skipped night
(2026-07-15 was the first). Worth knowing if you rely on the log as a continuous record —
the "Nth consecutive run" counters count executions, not calendar days.

Everything else static: **18th** straight run with no commits (HEAD still `2265049`,
2026-07-02, ~18.5 days back). This run replaced the inherited `git diff --numstat` check on
`orin-nano/` with a stronger one — `git diff --stat --ignore-all-space` reports **zero
changed lines** across all seven files, which is direct proof the churn is CRLF↔LF only
rather than an inference from equal insert/delete counts. `docs/recent-considerations.md`
(223/12) is the only non-maintenance file with real content changes. Code-side inventory
re-derived from source, not carried forward: 9 `.from()` targets + `votes` + 6 `dashboard_*`
+ `user_profiles` = **17 luis-ruiz-owned tables**, no drift; migrations 13 forward / 8 down;
`rate_limits` at exactly 0 code references; hero video at 0 references. `.md` NUL scan via
`tr -cd '\000'` → **0 bytes** everywhere (item stays CLOSED). 0 TODO/FIXME/HACK comments.
Row counts still carried from **2026-07-10 (11 days stale — treat as floors)**; expect ~5–6
unseen `contactlist` spam rows at the observed cadence.

**Meta-observation worth acting on:** `MAINTENANCE_LOG.md` has reached ~84 KB, almost all of
it eighteen near-identical entries. A nightly agent on a static repo with a blocked DB is
mostly paying to re-confirm "nothing changed." This run wrote a deliberately short entry.
Consider archiving entries older than ~14 days into `docs/maintenance-archive/` and dropping
the schedule to weekly until work on luis-ruiz resumes.

---

## 2026-07-22 — nightly maintenance note

**Supabase still unreachable — eleventh consecutive run.** `list_tables` against ref
`huyhgdsjpdjzokjwaspb` returned the same `MCP error -32600: You do not have permission to
perform this action`; `list_projects` still shows only org `chuzvccapvwvbdhmycyr`
(`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`). Diagnosis unchanged and
settled: the token is healthy but scoped to the wrong org, so it will not self-heal. Steps
2–4 of the maintenance routine were skipped per Rule #4. Row counts remain carried from
**2026-07-10 — now 12 days stale, treat every number as a floor**; at the observed spam
cadence expect roughly 6 unseen `contactlist` rows.

**New this run: three empty leftover directories on disk.** Git does not track empty
directories, so `git status` never showed them and eleven prior runs missed them:
`app/(authenticated)/admin/legacy-ai/` (residue of `7b33e4c`), `app/account/` (residue of
the account page moving into the `(authenticated)` group), and `docs/seo/`. They are
harmless to the build, but the `app/account/` one had been quietly corrupting the briefing
— AGENTS.md §3 described `/account` as a *public auth entry point* when it is an empty
folder with no route files. Both that and the `docs/seo/` entry are now corrected, and a
`rmdir` was folded into the §9 housekeeping block.

**The schedule ran on time** — no skipped night this time (2026-07-21 04:09 → 2026-07-22
04:06 UTC). Otherwise static: **19th** straight run with no commits (HEAD still `2265049`,
2026-07-02, ~19.5 days back). Verifications re-derived from source rather than carried
forward: `git diff --stat --ignore-all-space` does not list `orin-nano/` at all (zero real
changed lines — CRLF↔LF churn confirmed, still no `.gitattributes`); 9 `.from()` targets +
`votes` + 6 `dashboard_*` + `user_profiles` = **17 luis-ruiz-owned tables**, no drift;
migrations 13 forward / 8 down; `rate_limits` at exactly 0 code references (15 days now
with no progress on wiring it); hero video at 0 references; `README.md` still 1,450 bytes
of stock `create-next-app` boilerplate; `.md` NUL scan via `tr -cd '\000'` → 0 bytes
everywhere (CLOSED, 6th clean run); 0 TODO/FIXME/HACK comments.

**Standing recommendation, unchanged:** the doc backlog is the quiet risk. Nineteen runs of
edits to `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, and this file sit
uncommitted (892 insertions / 224 deletions), and the only committed `AGENTS.md` is from
2026-07-02. A lost working tree costs three weeks of briefing. Pair the `chore(docs)` commit
with the `.gitattributes` normalization and the three `rmdir`s — it is one paste, listed in
AGENTS.md §9 step 3.

---

### 2026-07-23 04:05 UTC — nightly run (short)

**No change in kind.** 20th consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~21 days back). Schedule on time (2026-07-22 04:06 → 2026-07-23 04:05 UTC).
Supabase still unreachable — **12th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr`. Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried
forward from 2026-07-10, now **13 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (16 days with
no wiring); the three empty leftover dirs (`app/(authenticated)/admin/legacy-ai`,
`app/account`, `docs/seo`) still present; Obsidian vault still 6 files, still untracked.
Doc backlog now spans the 2026-07-03 → 2026-07-23 runs across `AGENTS.md`,
`MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, and this file — still uncommitted. The single
highest-value action remains unchanged: authorize the Supabase org that owns
`huyhgdsjpdjzokjwaspb`, then commit the backlog (`chore(docs)` block in AGENTS.md §9).

---

### 2026-07-24 04:05 UTC — nightly run (short)

**No change in kind.** 21st consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~22 days back). Schedule on time (2026-07-23 04:05 → 2026-07-24 04:05 UTC).
Supabase still unreachable — **13th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr`. Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried
forward from 2026-07-10, now **14 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (17 days with
no wiring); 9 `.from()` targets + 6 `dashboard_*` tables unchanged; 13 forward / 8 down
migrations; 0 TODO/FIXME/HACK comments; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still 1,450-byte stock boilerplate; NUL
scan of tracked `.md` files clean (8th run). Doc backlog now spans the 2026-07-03 →
2026-07-24 runs across `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, and this
file — still uncommitted (~1,056 insertions / 240 deletions). The single highest-value
action remains unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then
commit the backlog (`chore(docs)` block in AGENTS.md §9).

---

### 2026-07-25 04:05 UTC — nightly run (short)

**No change in kind.** 22nd consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~23 days back). Schedule on time (2026-07-24 04:05 → 2026-07-25 04:05 UTC).
Supabase still unreachable — **14th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr`. Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried
forward from 2026-07-10, now **15 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (18 days with
no wiring); 9 `.from()` targets + 6 `dashboard_*` tables unchanged; 13 forward / 8 down
migrations; 0 TODO/FIXME/HACK comments; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still 1,450-byte stock boilerplate; NUL
scan of tracked `.md` files clean (9th run). Doc backlog now spans the 2026-07-03 →
2026-07-25 runs across `AGENTS.md`, `MAINTENANCE_LOG.md`, `TABLES_TO_DELETE.md`, and this
file — still uncommitted (~1,105 insertions / 240 deletions). The single highest-value
action remains unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then
commit the backlog (`chore(docs)` block in AGENTS.md §9).

---

### 2026-07-26 04:05 UTC — nightly run (short)

**No change in kind.** 23rd consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~24 days back). Schedule on time (2026-07-25 04:05 → 2026-07-26 04:05 UTC).
Supabase still unreachable — **15th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr`. Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried
forward from 2026-07-10, now **16 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (19 days with
no wiring); 9 `.from()` targets + 6 `dashboard_*` tables unchanged; 13 forward / 8 down
migrations; 0 TODO/FIXME/HACK comments; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still 1,450-byte stock boilerplate; NUL
scan of tracked `.md` files clean (10th run). Confirmed via `--ignore-all-space` that the
7 `orin-nano/` files are **pure CRLF churn** (they vanish from the diffstat when whitespace
is ignored); only `docs/recent-considerations.md` carries real content this cycle. The
single highest-value action remains unchanged: authorize the Supabase org that owns
`huyhgdsjpdjzokjwaspb`, then commit the backlog + add `.gitattributes` (`chore(docs)` block
in AGENTS.md §9).

### 2026-07-27 04:05 UTC — nightly run (short)

**No change in kind.** 24th consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~25 days back). Schedule on time (2026-07-26 04:05 → 2026-07-27 04:05 UTC).
Supabase still unreachable — **16th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**17 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (20 days with
no wiring); 9 `.from()` targets + 6 `dashboard_*` tables unchanged; 13 forward / 8 down
migrations; 0 TODO/FIXME/HACK comments; NUL scan of tracked `.md` files clean (11th run).
The single highest-value action remains unchanged: authorize the Supabase org that owns
`huyhgdsjpdjzokjwaspb`, then commit the backlog + add `.gitattributes` (`chore(docs)` block
in AGENTS.md §9). Standing recommendation reiterated: drop this agent to **weekly** while
the repo stays idle — a nightly pass on a 25-day-static repo produces one near-duplicate
log entry per night and is itself the main source of the doc-commit backlog it reports.

### 2026-07-29 04:05 UTC — nightly run (short)

**No change in kind.** 26th consecutive run with no commits (HEAD still `2265049`,
2026-07-02, ~27 days back). The 2026-07-28 run updated AGENTS/MAINTENANCE_LOG/
TABLES_TO_DELETE but did not append here, so no 2026-07-28 entry exists in this log — the
gap is expected, not a skipped night. Supabase still unreachable — **18th consecutive**
`list_tables` denial on ref `huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`);
`list_projects` shows only org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE,
`razzy-db`, `sota-board-lake`). Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried
forward from 2026-07-10, now **19 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (22 days with
no wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6
`dashboard_*` = 17 owned tables, unchanged; 13 forward / 8 down migrations; hero video
still **0** references; 0 real TODO/FIXME/HACK comments (the 65 raw `grep` hits are all the
`todos` feature name, not comment markers); the three empty leftover dirs still present;
Obsidian vault still 6 files, still untracked; `README.md` still stock boilerplate; NUL scan
of the four root maintenance docs clean (13th run). The single highest-value action remains
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
backlog + add `.gitattributes`. Standing recommendation reiterated: drop this agent to
**weekly** while the repo stays idle.

### 2026-08-01 12:50 UTC — nightly run (short)

**No change in kind.** 28th logged run with no commits (HEAD still `2265049`, 2026-07-02,
~30 days back). **Schedule gap: no run/log entry for 2026-07-31** — previous run 2026-07-30,
this run 2026-08-01; one nightly pass was skipped or not saved (the 2026-07-30 run also did
not append here, so the prior entry above is 2026-07-29). Supabase still unreachable —
**20th consecutive** `list_tables` denial on ref `huyhgdsjpdjzokjwaspb` (`MCP error -32600:
permission denied`); `list_projects` shows only org `chuzvccapvwvbdhmycyr`
(`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`). Steps 2–4 skipped per SKILL
Rule #4; §4 row counts carried forward from 2026-07-10, now **22 days stale**. Nothing
dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (25 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; hero video
still **0** references; 0 real TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still stock boilerplate; no `.gitattributes`
yet; NUL scan of the four root maintenance docs clean (15th run). Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
backlog + add `.gitattributes`. Standing recommendation reiterated: drop this agent to
**weekly** while the repo stays idle.

### 2026-08-02 04:05 UTC — nightly run (short)

**No change in kind.** 29th logged run with no commits (HEAD still `2265049`, 2026-07-02,
~31 days back). Cadence back to normal: this run 2026-08-02 04:05 UTC followed the previous
run (2026-08-01 12:50 UTC); the only historical schedule gap remains the missing 2026-07-31
entry. Supabase still unreachable — **21st consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**23 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (26 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; hero video
still **0** references; 0 real TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still stock boilerplate; no `.gitattributes`
yet; NUL scan of the four root maintenance docs clean (16th run). Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
backlog + add `.gitattributes`. Standing recommendation reiterated: drop this agent to
**weekly** while the repo stays idle.

### 2026-08-03 04:05 UTC — nightly run (short)

**No change in kind.** 30th logged run with no commits (HEAD still `2265049`, 2026-07-02,
~32 days back). Normal cadence: this run 2026-08-03 04:05 UTC followed the previous
run (2026-08-02 04:05 UTC); the only historical schedule gap remains the missing 2026-07-31
entry. Supabase still unreachable — **22nd consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**24 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (27 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; hero video
still **0** references; 0 real TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; `README.md` still stock boilerplate; no `.gitattributes`
yet; NUL scan of the four root maintenance docs clean (17th run). Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
backlog + add `.gitattributes`. Standing recommendation reiterated: drop this agent to
**weekly** while the repo stays idle.

### 2026-08-04 04:06 UTC — nightly run (short)

**No change in kind.** 31st logged run with no commits (HEAD still `2265049`, 2026-07-02,
~33 days back). Normal cadence: this run 2026-08-04 04:06 UTC followed the previous
run (2026-08-03 04:05 UTC); the only historical schedule gap remains the missing 2026-07-31
entry. Supabase still unreachable — **23rd consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**25 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (28 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; 0 real
TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; no `.gitattributes` yet. Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
backlog + add `.gitattributes`. Standing recommendation reiterated: drop this agent to
**weekly** while the repo stays idle.

### 2026-08-16 16:32 UTC — nightly run (short)

**No change in kind — but the cadence has visibly dropped.** 32nd logged run with no commits
(HEAD still `2265049`, 2026-07-02, ~45 days back). This run followed the previous logged run
(2026-08-04 04:06 UTC) after a **~12-day gap** — no runs 2026-08-05 → 2026-08-15. That is
consistent with the long-standing recommendation to move off nightly; effective cadence is now
sparser than weekly. Supabase still unreachable — **24th consecutive** `list_tables` denial on
ref `huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**37 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (40 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; 0 real
TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; no `.gitattributes` yet; 4 root docs NUL-clean. No
code-side drift of any kind. Highest-value action unchanged: authorize the Supabase org that
owns `huyhgdsjpdjzokjwaspb`, then commit the ~month-and-a-half doc backlog + add
`.gitattributes`.

### 2026-08-17 04:06 UTC — nightly run (short)

**Nightly cadence resumed; no change in kind.** 33rd logged run with no commits (HEAD still
`2265049`, 2026-07-02, ~46 days back). This run followed the previous logged run
(2026-08-16 16:32 UTC) after **~11.5 hours** — a normal nightly interval, so last run's
one-off ~12-day gap (no runs 2026-08-05 → 2026-08-15) did not repeat. The standing
recommendation to move this agent to **weekly** while the repo is idle still stands.
Supabase still unreachable — **25th consecutive** `list_tables` denial on ref
`huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects` shows only
org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`, `sota-board-lake`).
Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from 2026-07-10, now
**38 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (41 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; 0 real
TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; no `.gitattributes` yet; hero video `hero-bg-lighting`
still 0 refs. No code-side drift of any kind. Highest-value action unchanged: authorize the
Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the ~month-and-a-half doc backlog +
add `.gitattributes`.

### 2026-08-20 16:05 UTC — nightly run (short)

**"Nightly cadence resumed" did NOT hold; cadence is irregular.** 34th logged run with no
commits (HEAD still `2265049`, 2026-07-02, ~49 days back). This run followed the previous
logged run (2026-08-17 04:06 UTC) after **~3.5 days** — so last run's "cadence resumed" call
was premature. Recent spacing has swung erratically: ~12 days → ~11.5h → ~3.5 days. This
reinforces (again) the standing recommendation to put the agent on an explicit **weekly**
cadence while the repo is idle. Supabase still unreachable — **26th consecutive** `list_tables`
denial on ref `huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects`
shows only org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`,
`sota-board-lake`). Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from
2026-07-10, now **41 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (44 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; 0 real
TODO/FIXME/HACK comment markers; the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; no `.gitattributes` yet; hero video `hero-bg-lighting`
still 0 refs; 4 root docs NUL-clean. No code-side drift of any kind. Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
~month-and-a-half doc backlog + add `.gitattributes`.

### 2026-08-21 04:05 UTC — nightly run (short)

**Cadence back to ~12h, but still erratic overall.** 35th logged run with no commits (HEAD
still `2265049`, 2026-07-02, ~50 days back). This run followed the previous logged run
(2026-08-20 16:05 UTC) after **~12 hours** — roughly nightly — but the run before that sat
~3.5 days out, so the multi-week sequence (~12 days → ~11.5h → ~3.5 days → ~12h) remains
erratic. The standing recommendation to put the agent on an explicit **weekly** cadence while
the repo is idle still stands. Supabase still unreachable — **27th consecutive** `list_tables`
denial on ref `huyhgdsjpdjzokjwaspb` (`MCP error -32600: permission denied`); `list_projects`
shows only org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech` INACTIVE, `razzy-db`,
`sota-board-lake`). Steps 2–4 skipped per SKILL Rule #4; §4 row counts carried forward from
2026-07-10, now **42 days stale**. Nothing dropped or altered.

Re-verified from source this run: `rate_limits` still **0** code references (45 days with no
wiring); 9 `.from()` targets + `votes` in `ADMIN_TABLES` (10 registered) + 6 `dashboard_*` +
`user_profiles` = 17 owned tables, unchanged; 13 forward / 8 down migrations; **0 real
TODO/FIXME/HACK comment markers** (the 14 raw `grep` hits are all `todo`/`Todo` in the todos
CRUD feature, not comments — verified this run); the three empty leftover dirs
(`app/(authenticated)/admin/legacy-ai`, `app/account`, `docs/seo`) still present; Obsidian
vault still 6 files, still untracked; no `.gitattributes` yet; hero video `hero-bg-lighting`
still 0 refs; 4 root docs NUL-clean. No code-side drift of any kind. Highest-value action
unchanged: authorize the Supabase org that owns `huyhgdsjpdjzokjwaspb`, then commit the
~seven-week doc backlog + add `.gitattributes`.
