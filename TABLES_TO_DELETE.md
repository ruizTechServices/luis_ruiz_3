# Tables Flagged for Deletion

> Reviewed on **2026-06-30** for project ref `huyhgdsjpdjzokjwaspb`.
> Exact row counts must be verified with `SELECT count(*)`; Supabase table
> estimates have been unreliable in this project.
>
> **Do not drop data-bearing tables without export artifacts and captured DDL.**

## Current Flags

**None.** As of 2026-06-30 there are no orphaned tables. All 17 tables in the
`public` schema are referenced by current app code (see `AGENTS.md` §4).

## Resolved Since Last Run (dropped from the project)

The following tables were flagged in prior runs and **have now been dropped**
from the Supabase project. They no longer exist in `public`:

- `conversations` (was 32 rows) — retired server-side AI conversations
- `chat_messages` (was 28 rows) — retired server-side AI messages
- `chat_embeddings` (was 18 rows) — retired server-side AI embeddings
- `round_robin_sessions` (was 27 rows) — retired multi-model AI sessions
- `round_robin_messages` (was 154 rows) — messages for retired round-robin sessions
- `project_blog_links` (was 0 rows) — empty project↔blog join stub

### Follow-up (not table deletions, but related cleanup)
Helper RPCs that referenced the dropped AI tables may now be dead and can be
removed with a reversible migration after confirming no callers:
`match_chat_embeddings(...)`, `match_chat_messages(...)`,
`get_next_chat_id()` / `next_chat_id()`.

## Notes

- The IndexedDB object stores named `conversations`/`messages`/`memories` in
  `lib/browser-db/*` are the active Orin chat persistence layer — they are NOT
  Supabase table references and must not be confused with the dropped tables.
- If any future table loses all code references, add it here with its exact row
  count and a reversible `DROP` path. Drop automatically only if it is empty.
