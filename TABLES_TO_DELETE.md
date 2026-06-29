# Tables Flagged for Deletion

> Reviewed on **2026-06-29** for project ref `huyhgdsjpdjzokjwaspb`.
> Exact row counts must be verified with `SELECT count(*)`; Supabase table
> estimates have been unreliable in this project.
>
> **Do not drop data-bearing tables without export artifacts and captured DDL.**

## Current Flags

### Retired server-side AI tables
- **Tables:** `conversations`, `chat_messages`, `chat_embeddings`,
  `round_robin_sessions`, `round_robin_messages`
- **Last verified row counts:** 32 / 28 / 18 / 27 / 154
- **Active app references:** none in `app/`, `lib/admin`, `components/`, or
  `scripts/`
- **Why flagged:** the current Orin chat persists in IndexedDB
  (`lib/browser-db/*`), and the admin count-only viewer was removed.
- **Safe deletion path:** export data, capture DDL/down migration, drop child
  tables before parent tables, and remove now-dead helper RPCs.

### `project_blog_links`
- **Row count:** 0
- **Active app references:** none in `app/`, `lib/`, `components/`, or `scripts/`
- **Why flagged:** empty project-to-blog join table for a feature that is not
  currently built.
- **Safe deletion path:** confirm the linking feature is abandoned, then drop
  with a reversible migration.

## Notes

- The admin overview no longer counts retired server-side AI tables.
- The retired-AI admin route has been removed.
- IndexedDB store names in `lib/browser-db/*` are not Supabase table references.
