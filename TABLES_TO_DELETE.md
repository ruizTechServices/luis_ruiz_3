# Tables Flagged for Deletion

> Reviewed by the nightly maintenance agent. These tables are not referenced
> anywhere in the application code (`app/`, `lib/`, `components/`,
> `supabase/migrations/`).
> **DO NOT drop without reviewing the rows first.**

> ✅ **Counts verified against the live DB on 2026-06-28** (project ref
> `huyhgdsjpdjzokjwaspb`). Nothing was dropped: the five data-bearing tables are
> never auto-dropped, and the one empty orphan (`project_blog_links`) was left in
> place because it is plausibly future-facing — Gio should confirm the
> project↔blog linking feature is abandoned before it is dropped.

---

### `round_robin_messages`
- **Row count:** 154
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No
- **Reason for deletion:** Belongs to the legacy/future "round robin" multi-model AI feature; no current app code path reads it.
- **To delete:** `DROP TABLE public.round_robin_messages;` (archive first — has rows).
- **Rows preview:** Available in DB; archive an export before dropping.

### `round_robin_sessions`
- **Row count:** 27
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No
- **Reason for deletion:** Legacy/future multi-model AI sessions; not referenced by current app code.
- **To delete:** `DROP TABLE public.round_robin_sessions;` (drop `round_robin_messages` first or use CASCADE; archive first — has rows).
- **Rows preview:** Available in DB; archive an export before dropping.

### `conversations`
- **Row count:** 32
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No
- **Reason for deletion:** Legacy/server-side AI conversation records. The current app persists Orin chats in browser IndexedDB (`lib/browser-db/*`), not Supabase.
- **To delete:** `DROP TABLE public.conversations;` (archive first — has rows). Confirm AI-persistence direction before dropping.
- **Rows preview:** Available in DB; archive an export before dropping.

### `chat_messages`
- **Row count:** 28
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No (only via `match_chat_messages()` RPC, which the app does not call)
- **Reason for deletion:** Legacy/server-side AI messages; superseded by IndexedDB persistence.
- **To delete:** `DROP TABLE public.chat_messages;` (archive first — has rows). Confirm AI-persistence direction before dropping.
- **Rows preview:** Available in DB; archive an export before dropping.

### `chat_embeddings`
- **Row count:** 18
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No (only via `match_chat_embeddings()` RPC, which the app does not call)
- **Reason for deletion:** Legacy/server-side AI embeddings; superseded by IndexedDB persistence.
- **To delete:** `DROP TABLE public.chat_embeddings;` (archive first — has rows). Confirm AI-persistence direction before dropping.
- **Rows preview:** Available in DB; archive an export before dropping.

### `project_blog_links`
- **Row count:** 0
- **Last checked:** 2026-06-28 (verified live)
- **Referenced in code:** No
- **Reason for deletion:** Empty join table for a not-yet-built project↔blog cross-linking feature.
- **To delete:** `DROP TABLE public.project_blog_links;` — empty, so low risk, **but** it is plausibly future-facing per `docs/recent-considerations.md`. Confirm the linking feature is abandoned before dropping. (Normally an empty orphan would be auto-dropped; left in place pending Gio's confirmation because it maps to a planned feature.)
- **Rows preview:** Empty.

---

## Notes

- All entries above are **flagged, not deleted.** Per maintenance policy, tables
  with rows are never dropped automatically; the one empty table
  (`project_blog_links`) was left in place pending Gio's confirmation that the
  planned project↔blog linking feature is abandoned.
- These five data-bearing tables (`round_robin_messages`,
  `round_robin_sessions`, `conversations`, `chat_messages`, `chat_embeddings`)
  are all tied to the **undecided AI-persistence direction**. Resolve that
  decision (IndexedDB vs. server-side) before archiving or dropping any of them.
- Related RPC functions that would become dead if these tables are dropped:
  `match_chat_messages()`, `match_chat_embeddings()`, `get_next_chat_id()` /
  `next_chat_id()`.
