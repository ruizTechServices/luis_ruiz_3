# Tables Flagged for Deletion / Review

> Reviewed on **2026-08-21 04:05 UTC** for project ref `huyhgdsjpdjzokjwaspb`.
> ⚠️ **DB NOT reachable — TWENTY-SEVENTH CONSECUTIVE RUN.** The Supabase MCP connection only
> exposed org `chuzvccapvwvbdhmycyr` (`ghost-ai-ruiztech`, `razzy-db`,
> `sota-board-lake`); `huyhgdsjpdjzokjwaspb` was not in the accessible project list,
> and a direct `list_tables` call against that ref returned **`MCP error -32600: You do
> not have permission to perform this action`** — the same error, twenty-seven runs running.
> **Diagnosis settled; control test retired.** Prior runs proved the connection is
> healthy by reading `sota-board-lake` cleanly while the target ref denied permission —
> it is merely **scoped to the wrong org**. Re-proving that nightly was noise, so it was
> NOT re-run this time. This will not self-heal. So **no `SELECT count(*)` could run and
> no table was dropped or altered.** Row counts below are last-known values from the
> **2026-07-10** audit (now 42 days stale). Only the codebase-reference check was performed
> this run (via local `grep`), and it still finds **zero** references to `rate_limits`.
> (Schedule note: cadence is irregular — this run 2026-08-21 followed the previous logged run 2026-08-20 after ~12h; the run before that sat ~3.5 days out, so recent spacing has swung from ~12 days to ~11.5h to ~3.5 days to ~12h — erratic, not dependable nightly. One historical gap also remains — no run/log entry for 2026-07-31.)
>
> **Do not drop data-bearing tables without export artifacts and captured DDL.**

## Current Flags

### `rate_limits`  — flagged since 2026-07-07, still NOT dropped
- **Row count:** 0 as of the last successful audit (2026-07-10, exact `SELECT count(*)`). **Not re-verified on 2026-07-11 through 2026-08-21 — DB unreachable all twenty-seven runs (see header).**
- **Last checked:** 2026-08-21 04:05 UTC — code-reference check only (DB not reachable, permission denied). Still **zero** code references (exact `grep` match count across `app`/`lib`/`components`/`scripts`/`supabase`: 0) and still no migration file. Row count carried forward (0) from 2026-07-10; could not be re-queried for a twenty-seventh run. Still flagged, still NOT dropped. **45 days have now passed since this table first appeared with no progress on wiring it up.** Prior context: three bot-like contact-form submissions in five days (ids 15, 17, 18 — last on 2026-07-09) reinforce that `rate_limits` is intended anti-spam scaffolding Gio should wire up. **Note:** with the DB unreachable, new spam rows since 2026-07-10 would go undetected — the contactlist count of 5 is a floor, not a current value (at the observed cadence, ~21 unseen rows are likely).
- **Referenced in code:** **No** — zero matches for `rate_limits` across
  `app`/`lib`/`components`/`scripts`/`supabase` (`.ts/.tsx/.js/.jsx/.mjs/.sql`).
  (The only "rate" hit is `supabase/config.toml`'s built-in Supabase **auth**
  rate-limit settings, which are unrelated to this table.)
- **Migration file:** **None.** The table exists in the database but has no
  forward migration in `supabase/migrations/` and no `migrations_down/` rollback.
  This is untracked DB drift — a fresh environment would not reproduce it.
- **Schema:** `key` text NOT NULL, `window_start` timestamptz NOT NULL,
  `hits` integer NOT NULL — the classic shape of a **fixed-window rate limiter**.
- **Assessment:** Looks **intentional** (deliberate scaffolding, most likely for
  rate-limiting the public contact form — which just received a bot-like
  submission on 2026-07-05 — or the `/api/ai/*` routes). Because it is empty AND
  the schema is clearly purposeful, the maintenance agent **flagged rather than
  dropped** it, to avoid destroying in-progress work.
- **Action for Gio (choose one):**
  - If intentional → capture a forward migration + `migrations_down/` rollback,
    add RLS policies, and wire it into the target route(s). Then remove this flag.
  - If accidental/leftover → `DROP TABLE public.rate_limits;` (it is empty).
- **Rows preview (first 3):** _none — table is empty._

## Resolved / Dropped in Prior Runs

The following tables were flagged in earlier runs and **have been dropped** from
the Supabase project. They no longer exist in `public`:

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
schema. They are now referenced only inside the historical migration
`20260627225925_...sql` and by no live app code. The only remaining `match_*`
RPCs are `match_documents(...)` and `match_gios_context(...)`, both valid/active.

## Not a deletion candidate — FOREIGN table

### `posts` — DO NOT FLAG, DO NOT DROP
- **Appeared:** rows created 2026-07-08 02:41 UTC; first tracked 2026-07-09.
- **Row count:** 2 (`SELECT count(*)`).
- **Referenced in luis-ruiz code:** No — and that's expected. It is **not** a luis-ruiz
  table. It belongs to **catherineruiz.com**, managed exclusively by the
  `catherine-ruiz-netlify-site` Netlify functions via the service role. (The table
  carries a DB `comment` saying exactly this.)
- **Why it's listed here:** so future maintenance runs do NOT mistake its lack of
  code references for an orphan and flag/drop it. It is a legitimate foreign table
  sharing this Supabase project. **Leave it alone.** (Its bilingual schema —
  `title`/`title_es`, `body_md`/`body_md_es`, `published`, `slug` — is unrelated to
  luis-ruiz's `blog_posts`.)

## Notes

- The IndexedDB object stores named `conversations`/`messages`/`memories` in
  `lib/browser-db/*` are the active Orin chat persistence layer — they are NOT
  Supabase table references and must not be confused with the dropped tables.
- If any future table loses all code references, add it here. Drop only if it is
  empty AND confirmed unintentional (see the `rate_limits` handling above for the
  "empty but deliberate" case — flag, don't auto-drop).
