# Tables Flagged for Deletion

> Reviewed by the nightly maintenance agent on **2026-06-29** (project ref
> `huyhgdsjpdjzokjwaspb`). These tables are not referenced anywhere in the
> application code (`app/`, `lib/`, `components/`, `scripts/`).
> **DO NOT drop without reviewing first.**

> ✅ **Row counts verified against the live DB on 2026-06-29 via exact
> `SELECT count(*)`** (the `list_tables` estimate reported 0 for every table and
> is NOT reliable). Nothing was dropped this run.

---

## Major change since 2026-06-28

The five legacy AI tables previously flagged here — `round_robin_messages`,
`round_robin_sessions`, `conversations`, `chat_messages`, and `chat_embeddings`
— are **no longer orphaned.** They are now referenced read-only by the admin
interface:

- `lib/admin/data.ts` lists them in `LEGACY_TABLES` and counts them in
  `getAdminOverview()`.
- `app/(authenticated)/admin/legacy-ai/page.tsx` renders those counts as a
  read-only "Legacy AI inventory" page.

Because they are now referenced in code, they have been **removed from this
deletion list** and reclassified ACTIVE (admin read-only) in `AGENTS.md`. Their
data (32/28/18/27/154 rows respectively) is intact. The AI-persistence direction
is still undecided — keep them until that decision is made.

---

## Currently flagged

### `project_blog_links`
- **Row count:** 0 (verified live 2026-06-29)
- **Last checked:** 2026-06-29
- **Referenced in code:** No (0 references in `app/`, `lib/`, `components/`, `scripts/`)
- **Schema:** `id bigint`, `project_id bigint`, `blog_post_id bigint`, `created_at timestamptz`
- **Reason it is flagged:** Empty join table for a not-yet-built project↔blog
  cross-linking feature. By the strict maintenance rule, an orphaned + empty
  table would be auto-dropped.
- **Why it was NOT dropped:** It is explicitly documented as plausibly
  future-facing in `docs/recent-considerations.md` ("Keep for future linking
  even though empty"). Dropping it would destroy a deliberately-preserved
  feature stub. **Deferring to Gio's prior intent** rather than taking an
  irreversible destructive action autonomously.
- **To delete (only after Gio confirms the feature is abandoned):**
  `DROP TABLE public.project_blog_links;`
- **Rows preview:** Empty.

---

## Notes
- Nothing was dropped this run. The only flagged table (`project_blog_links`)
  is empty and low-risk to drop, but is preserved pending Gio's confirmation
  that the project↔blog linking feature is abandoned.
- The legacy AI tables are no longer candidates for deletion while they remain
  wired into the `/admin/legacy-ai` viewer. Related RPCs that would become dead
  only if those tables are eventually dropped: `match_chat_messages()`,
  `match_chat_embeddings()`, `get_next_chat_id()` / `next_chat_id()`.
- `journal` (54 rows) and `todos` (54 rows) are NOT flagged — they are now
  surfaced through admin CRUD pages (`/admin/journal`, `/admin/todos`).
