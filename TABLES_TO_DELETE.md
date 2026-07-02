# Tables Flagged for Deletion

> Reviewed on **2026-07-02 04:05 UTC** for project ref `huyhgdsjpdjzokjwaspb`.
> Exact row counts must be verified with `SELECT count(*)`; Supabase table
> estimates have been unreliable in this project (this run they again reported
> all-zero except `user_profiles`, contradicted by real `COUNT(*)`).
>
> **Do not drop data-bearing tables without export artifacts and captured DDL.**

## Current Flags

**None.** As of 2026-07-01 there are no orphaned tables. All 17 tables in the
`public` schema are referenced by current app code (verified by grep this run;
see `AGENTS.md` §4).

## Resolved Since Last Run (dropped from the project)

The following tables were flagged in prior runs and **have now been dropped**
from the Supabase project. They no longer exist in `public`:

- `conversations` (was 32 rows) — retired server-side AI conversations
- `chat_messages` (was 28 rows) — retired server-side AI messages
- `chat_embeddings` (was 18 rows) — retired server-side AI embeddings
- `round_robin_sessions` (was 27 rows) — retired multi-model AI sessions
- `round_robin_messages` (was 154 rows) — messages for retired round-robin sessions
- `project_blog_links` (was 0 rows) — empty project↔blog join stub

### Follow-up (RESOLVED 2026-07-02)
The helper RPCs that referenced the dropped AI tables —
`match_chat_embeddings(...)`, `match_chat_messages(...)`,
`get_next_chat_id()` / `next_chat_id()` — **no longer exist** in the `public`
schema (verified this run via `pg_proc`). They are now referenced only inside the
historical migration `20260627225925_...sql` and by no live app code. No further
action needed. The only remaining `match_*` RPCs are `match_documents(...)` and
`match_gios_context(...)`, both valid and active.

## Notes

- The IndexedDB object stores named `conversations`/`messages`/`memories` in
  `lib/browser-db/*` are the active Orin chat persistence layer — they are NOT
  Supabase table references and must not be confused with the dropped tables.
- If any future table loses all code references, add it here with its exact row
  count and a reversible `DROP` path. Drop automatically only if it is empty.
