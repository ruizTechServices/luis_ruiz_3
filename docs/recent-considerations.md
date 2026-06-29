# Recent Considerations

Last verified: 2026-06-28

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
