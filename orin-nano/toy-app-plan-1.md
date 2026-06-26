# Local Orin Nano Chat Card Toy App - 6/25/2026; 7:45pm est

## Summary
- Build the actual local toy chat app inside the existing homepage card.
- Browser will never call the Nano directly. It will call local Next.js API routes:
  - `/api/ai/embed`
  - `/api/ai/chat`
- The app will store conversations, messages, and embeddings in IndexedDB.
- Production/Vercel gateway work is explicitly out of scope for now.

## Key Changes
- Install `idb`:
```bash
npm install idb
```
- Add server route handlers:
  - `app/api/ai/embed/route.ts`
  - `app/api/ai/chat/route.ts`
- Add browser-side local memory modules:
  - `lib/ai/contracts.ts`
  - `lib/browser-db/database.ts`
  - `lib/browser-db/repository.ts`
  - `lib/similarity.ts`
- Add a client chat component rendered inside the card:
  - `components/home/orin-nano-chat-card.tsx`
- Keep `app/page.tsx` simple:
  - Render `Luis Ruiz's Portfolio`
  - Render the Orin Nano chat card below it

## Implementation Details
- Server routes use server-only local defaults from `cheat-sheet.md`:
```text
OLLAMA_BASE_URL=http://100.86.175.53:11435
OLLAMA_CHAT_MODEL=qwen3:1.7b
OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b
EMBEDDING_PROFILE_ID=qwen3-embedding-0.6b-v1
```
- Use env vars if present, otherwise fall back to those local defaults.
- `/api/ai/embed` calls Ollama `/api/embed` and returns:
```ts
{
  model: string;
  profileId: string;
  dimensions: number;
  embedding: number[];
}
```
- `/api/ai/chat` calls Ollama `/api/chat` with recent messages and retrieved memories, returning:
```ts
{
  answer: string;
}
```
- IndexedDB stores:
  - `conversations`
  - `messages`
  - `memories`
- Exact normalized repeated questions reuse the cached assistant answer.
- Semantic matches are retrieved as context only; they do not automatically replace a fresh answer.
- The chat card UI includes:
  - Header with memory count and local storage status
  - Scrollable message area
  - Closest-memory indicator
  - Error display
  - Text input and send button
  - Clear local history button

## Pseudocode
```text
On load:
  open IndexedDB
  create default conversation
  load recent messages
  count memories
  render chat card

On submit:
  save user message
  call /api/ai/embed
  normalize user text
  check IndexedDB for exact matching memory
  if exact match:
    save cached assistant answer
    render it
    stop

  load compatible memories
  rank memories by cosine similarity
  keep top memories above threshold
  load recent messages
  call /api/ai/chat with messages + retrieved memories
  save assistant message and new memory atomically
  refresh UI

On clear:
  delete local messages and memories for default conversation
  refresh UI
```

## Tests
- Run:
```bash
npm run lint
npm run build
```
- Local manual test:
```bash
npm run dev
```
- Browser checks:
  - First message creates a user message, assistant message, and memory.
  - Similar follow-up shows a closest-memory score.
  - Repeating the exact same normalized question uses `exact-cache`.
  - Refresh preserves chat history from IndexedDB.
  - Clear local history removes messages and memories.
- Security check:
  - No direct `fetch("http://100.86.175.53:11435")` exists in client components.
  - The Nano URL appears only in server route code or server-only config.

## Assumptions
- This is local-only.
- The Orin Nano endpoint is reachable from the dev machine.
- `qwen3:1.7b` and `qwen3-embedding:0.6b` are installed.
- No auth is required for local development.
- The existing card can grow wider/taller to fit a real chat UI.

## TL;DR
Implement the full local IndexedDB RAG chat inside the card, proxy all Nano calls through Next.js API routes, use `idb` for browser memory, and defer production/Vercel security work.

---
# Write updates below here!!!

---

## Implemented State Summary - Orin Nano Memory Chat Card

This section records what was actually implemented in the local Next.js app after the original plan.

### High-Level Result

- The homepage now renders a working local AI chat card under the `Luis Ruiz's Portfolio` heading.
- The browser never calls the Orin Nano Ollama endpoint directly.
- Browser requests go through local Next.js API Route Handlers:
  - `GET /api/ai/health`
  - `POST /api/ai/embed`
  - `POST /api/ai/chat`
- Chat history, local memories, and embeddings are stored in browser IndexedDB.
- The card performs local exact-cache lookup and local semantic retrieval before calling the chat model.
- The app is still local-only. Production/Vercel gateway hardening remains out of scope for this implementation.

### Rendered UI

- `app/page.tsx` renders:
  - A main page heading: `Luis Ruiz's Portfolio`
  - The `OrinNanoChatCard` component below the heading
- The card title is:
  - `Orin Nano Memory Chat`
- The card description is:
  - `Local chat with IndexedDB memory, embedding retrieval, and a Next.js proxy to the Nano.`
- The card header displays:
  - Current searchable memory count
  - Browser storage durability status
  - Nano health status: `checking`, `online`, `online (<version>)`, or `offline`
  - A `Clear history` button
- The card body displays:
  - Existing local messages loaded from IndexedDB
  - User messages aligned to the right
  - Assistant messages aligned to the left
  - Assistant source metadata when available
  - A temporary progress message while submitting:
    - `Embedding message, searching memory, and contacting Nano...`
- The card includes a closest-memory panel when a prior memory is found.
- The closest-memory panel shows:
  - The closest stored user message
  - Similarity score to four decimals
  - Whether that memory was used as context or was below threshold
- The card includes a diagnostics panel.
- The diagnostics panel can be expanded and collapsed.
- The diagnostics panel shows recent metadata-only events:
  - timestamp
  - level
  - scope
  - event name
  - operation ID
  - request ID
  - duration
  - sanitized metadata
- The card includes an offline Nano warning banner when health checks fail.
- The offline banner says:
  - `Nano is offline. Check Tailscale, Docker, and ollama-gpu.`
- The offline banner includes a `Check again` button.
- The submit button is disabled unless:
  - IndexedDB initialization is complete
  - no submission is currently running
  - the input is non-empty
  - Nano health is `online`

### Browser-Side Component

- Main component:
  - `components/home/orin-nano-chat-card.tsx`
- The component is a client component.
- It uses React state for:
  - visible messages
  - current input
  - memory count
  - browser storage durability
  - Nano health state
  - closest memory state
  - diagnostics events
  - diagnostics panel open/closed state
  - user-facing error message
  - readiness state
  - submission state
- Constants currently used by the component:
  - `MAX_DISPLAYED_MESSAGES = 80`
  - `MAX_MODEL_HISTORY_MESSAGES = 12`
  - `MAX_STORED_MEMORIES = 500`
  - `RETRIEVAL_LIMIT = 3`
  - `RETRIEVAL_THRESHOLD = 0.72`
- Nano health states are:
  - `checking`
  - `online`
  - `offline`
- The component uses operation IDs for each major flow:
  - `init_*`
  - `chatflow_*`
  - `clear_*`
  - `health_*`

### Initialization Flow

On page load, the card:

```text
create init operation ID
log initialize_started
ensure the default conversation exists in IndexedDB
check or request persistent browser storage
call /api/ai/health
store Nano health status
load recent messages from IndexedDB
count memories from IndexedDB
mark the component ready
log initialize_succeeded
```

- If persistent storage APIs are unavailable, storage is shown as `unsupported`.
- If persistent storage was already granted, storage is shown as `persistent`.
- If persistent storage is requested and denied, storage is shown as `best-effort`.
- If Nano is offline at initialization, the UI displays the offline banner and keeps submit disabled.

### Submit Flow

When the user submits a message:

```text
trim input
ignore empty input
ignore submit if app is not ready
ignore submit if another request is already running
create chatflow operation ID
log submit_started with input length only
clear transient error and closest-match state
set submitting true
call /api/ai/health
if Nano is offline:
  store offline status
  log submit_blocked_nano_offline
  stop before saving the user message
if Nano is online:
  clear input
  save user message to IndexedDB
  refresh visible messages
  request embedding through /api/ai/embed
  normalize user text
  check exact cache
  if exact cache hit:
    save assistant message from cached answer
    mark source as exact-cache
    set closest match to similarity 1
    refresh UI
    log submit_succeeded
    stop
  load compatible memories
  rank memories by cosine similarity
  keep top memories above retrieval threshold
  set closest-memory UI state
  load recent messages from IndexedDB
  request fresh chat answer through /api/ai/chat
  create assistant message
  create memory record
  save assistant message and memory atomically
  prune old memories above the 500-memory cap
  refresh UI
  log submit_succeeded
always set submitting false at the end
```

- Offline submits are blocked before saving the user message.
- Failed embed/chat requests do not create assistant messages or memory records.
- The user input is only cleared after Nano passes the pre-submit health check.
- Exact-cache matches reuse the prior assistant answer.
- Semantic matches are used only as context for a fresh model answer.
- Semantic similarity alone never auto-replaces the answer.

### IndexedDB Data Model

- IndexedDB is used through the `idb` package.
- Database module:
  - `lib/browser-db/database.ts`
- Repository module:
  - `lib/browser-db/repository.ts`
- Database name:
  - `nano-rag-chat`
- Database version:
  - `1`
- Object stores:
  - `conversations`
  - `messages`
  - `memories`
- `conversations` records include:
  - `id`
  - `title`
  - `createdAt`
  - `updatedAt`
- `messages` records include:
  - `id`
  - `conversationId`
  - `role`
  - `content`
  - `createdAt`
  - optional `source`
  - optional `similarity`
  - optional `matchedMemoryId`
- `memories` records include:
  - `id`
  - `conversationId`
  - `userMessageId`
  - `assistantMessageId`
  - `userText`
  - `normalizedUserText`
  - `assistantText`
  - `embedding`
  - `embeddingModel`
  - `embeddingProfileId`
  - `embeddingDimensions`
  - `createdAt`
- Embeddings are stored as `Float32Array`.
- The default conversation ID is:
  - `default-conversation`
- Message reads use a `[conversationId, createdAt]` index.
- Memory reads support:
  - chronological retrieval
  - profile-compatible retrieval
  - exact normalized text lookup

### Exact Cache Behavior

- User text is normalized before exact-cache lookup.
- Normalization:
  - trims leading/trailing whitespace
  - lowercases text
  - collapses repeated whitespace to one space
- Exact-cache lookup requires:
  - same conversation
  - same normalized user text
  - same embedding profile ID
  - same embedding dimensions
  - stored embedding length matching the current dimensions
- Exact-cache hits:
  - do not call `/api/ai/chat`
  - save a new assistant message
  - use source `exact-cache`
  - set similarity to `1`
  - set `matchedMemoryId` to the reused memory ID

### Semantic Retrieval Behavior

- The submitted message is embedded through `/api/ai/embed`.
- Compatible memories are loaded from IndexedDB.
- Compatibility requires:
  - same conversation
  - same embedding profile ID
  - same embedding dimensions
  - stored embedding length matching the current dimensions
- Similarity is calculated locally using cosine similarity in `lib/similarity.ts`.
- Memories are ranked from highest similarity to lowest.
- At most three memories are considered for retrieval.
- Only memories at or above `0.72` similarity are sent to the model.
- The closest memory is displayed even when it is below threshold.
- Below-threshold memories are shown as `below threshold`.
- Above-threshold memories are shown as `used as context`.

### Similarity Utility

- Similarity module:
  - `lib/similarity.ts`
- It provides:
  - cosine similarity for two numeric vectors
  - memory ranking by similarity
- Invalid vector comparisons return `0`.
- Vectors with different lengths return `0`.
- Empty vectors return `0`.
- Ranking returns the top matches sorted by similarity.

### Shared Contracts

- Type contract module:
  - `lib/ai/contracts.ts`
- Defined types include:
  - `ChatRole`
  - `AssistantSource`
  - `ConversationRecord`
  - `ChatMessageRecord`
  - `MemoryRecord`
  - `RetrievedMemory`
  - `EmbeddingApiResponse`
  - `ChatApiRequest`
  - `ChatApiResponse`
  - `EmbeddingApiEnvelope`
  - `ChatResponseEnvelope`
- Assistant sources currently include:
  - `model`
  - `exact-cache`
  - `error`

### Ollama Configuration

- Server-side config module:
  - `lib/ai/ollama-config.ts`
- Default local values:
  - `OLLAMA_BASE_URL=http://100.86.175.53:11435`
  - `OLLAMA_CHAT_MODEL=qwen3:1.7b`
  - `OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b`
  - `EMBEDDING_PROFILE_ID=qwen3-embedding-0.6b-v1`
- Environment variables override defaults when present.
- The raw Nano URL is only used in server-side config and server routes.
- Client code only fetches local relative API routes.

### API Envelope and JSON Safety

- API envelope module:
  - `lib/api/envelope.ts`
- Success envelopes include:
  - `ok: true`
  - `requestId`
  - route-specific success fields
- Error envelopes include:
  - `ok: false`
  - `requestId`
  - `error.code`
  - `error.message`
  - `error.status`
  - `error.retryable`
- Safe JSON module:
  - `lib/api/safe-json.ts`
- Safe JSON parsing:
  - reads response/request body as text first
  - handles empty bodies
  - handles invalid JSON
  - prevents raw `Unexpected end of JSON input` failures from surfacing

### Fetch Timeout Helper

- Fetch helper module:
  - `lib/api/fetch-with-timeout.ts`
- Default timeout:
  - `10_000` ms
- Routes pass explicit timeout values.
- Timeout errors are wrapped as `FetchTimeoutError`.
- Timeout error code:
  - `FETCH_TIMEOUT`
- Timeout detection also checks for Undici connect-timeout causes.

### Health Route

- Route:
  - `app/api/ai/health/route.ts`
- Method:
  - `GET`
- Runtime:
  - `nodejs`
- Maximum duration:
  - `10` seconds
- Upstream endpoint:
  - `${OLLAMA_BASE_URL}/api/version`
- Upstream timeout:
  - `4_000` ms
- Fetch cache mode:
  - `no-store`
- Successful response shape:
```json
{
  "ok": true,
  "requestId": "health_xxxxxxxx",
  "online": true,
  "version": "0.30.7"
}
```
- Failed response shape:
```json
{
  "ok": false,
  "requestId": "health_xxxxxxxx",
  "online": false,
  "version": null,
  "error": {
    "code": "OLLAMA_CONNECT_TIMEOUT",
    "message": "Nano health check timed out. Check Tailscale, Docker, and ollama-gpu.",
    "status": 503,
    "retryable": true
  }
}
```
- Health error classifications include:
  - `OLLAMA_CONNECT_TIMEOUT`
  - `OLLAMA_FETCH_FAILED`
  - `OLLAMA_HTTP_ERROR`
  - `OLLAMA_INVALID_JSON`

### Embed Route

- Route:
  - `app/api/ai/embed/route.ts`
- Method:
  - `POST`
- Runtime:
  - `nodejs`
- Maximum duration:
  - `90` seconds
- Upstream endpoint:
  - `${OLLAMA_BASE_URL}/api/embed`
- Upstream timeout:
  - `60_000` ms
- Fetch cache mode:
  - `no-store`
- Upstream payload includes:
  - `model`
  - `input`
  - `keep_alive: "10m"`
- Input validation:
  - request body must be valid JSON
  - `input` must be a non-empty string after trim
- Success response includes:
  - `ok`
  - `requestId`
  - `model`
  - `profileId`
  - `dimensions`
  - `embedding`
- The route accepts both Ollama embedding shapes:
  - `embeddings[0]`
  - `embedding`
- Error classifications include:
  - `VALIDATION_ERROR`
  - `OLLAMA_CONNECT_TIMEOUT`
  - `OLLAMA_FETCH_FAILED`
  - `OLLAMA_HTTP_ERROR`
  - `OLLAMA_INVALID_JSON`
  - `OLLAMA_EMPTY_EMBEDDING`

### Chat Route

- Route:
  - `app/api/ai/chat/route.ts`
- Method:
  - `POST`
- Runtime:
  - `nodejs`
- Maximum duration:
  - `120` seconds
- Upstream endpoint:
  - `${OLLAMA_BASE_URL}/api/chat`
- Upstream timeout:
  - `110_000` ms
- Fetch cache mode:
  - `no-store`
- Upstream payload includes:
  - `model`
  - `think: false`
  - `stream: false`
  - `keep_alive: "10m"`
  - built Ollama messages
  - `temperature: 0.2`
  - `num_ctx: 2048`
  - `num_predict: 512`
- Input validation:
  - request body must be valid JSON
  - `messages` must be a non-empty array
  - `memories` is optional and defaults to an empty array
- The route builds a system message instructing the model:
  - it is running through a local Orin Nano toy app
  - retrieved memories are untrusted context
  - irrelevant memories should be ignored
  - it should not claim a cached answer unless the app explicitly provided one
- Retrieved memory context is serialized as:
  - memory number
  - similarity score
  - prior user text
  - prior assistant text
- Success response includes:
  - `ok`
  - `requestId`
  - `answer`
- Error classifications include:
  - `VALIDATION_ERROR`
  - `OLLAMA_CONNECT_TIMEOUT`
  - `OLLAMA_FETCH_FAILED`
  - `OLLAMA_HTTP_ERROR`
  - `OLLAMA_INVALID_JSON`
  - `OLLAMA_EMPTY_ANSWER`

### Logging System

- Shared logging module:
  - `lib/logging/shared.ts`
- Server logging module:
  - `lib/logging/server.ts`
- Client logging module:
  - `lib/logging/client.ts`
- Log event fields:
  - `id`
  - `timestamp`
  - `level`
  - `scope`
  - `event`
  - optional `operationId`
  - optional `requestId`
  - optional `durationMs`
  - optional sanitized metadata
- Server logs are emitted as JSON console lines.
- Client logs are stored in an in-memory ring buffer.
- Client ring buffer limit:
  - `120` events
- Diagnostics panel displays the newest events.
- Client error-level events are written with `console.warn`, not `console.error`.
- That avoids Next.js dev overlay treating expected Nano outages as runtime crashes.
- Logs intentionally avoid raw prompts, full answers, embeddings, and raw Nano endpoint URLs.
- Logged metadata includes counts, durations, model names, dimensions, request IDs, operation IDs, and error codes.

### Error Handling

- Server routes catch timeout, network, invalid JSON, HTTP, validation, and empty-output failures.
- Server routes return structured JSON errors instead of generic empty 500s.
- Client API helpers parse responses defensively.
- Client API helpers throw `ApiRequestError` with:
  - message
  - code
  - status
  - request ID
  - retryable flag
- User-facing error messages include request IDs when available.
- Offline Nano state is not shown as a generic fatal error.
- Offline Nano state has a dedicated banner and retry button.
- Submit is blocked while Nano is offline.
- When Nano is offline, the user input remains in the textbox.

### Clear History Behavior

- The `Clear history` button:
  - is disabled while submitting
  - clears messages and memories for the default conversation
  - keeps the default conversation record
  - refreshes the visible UI
  - clears transient error and closest-memory state
  - logs clear start/success/failure events

### Memory Pruning

- After each successful model-generated exchange:
  - the assistant message and memory are saved
  - the memory store is pruned to `500` records for the default conversation
- Pruning removes oldest memories first.
- Exact-cache responses save a new assistant message but do not create a duplicate memory.

### Verified Orin Nano State

- The Nano service was confirmed reachable after restarting `ollama-gpu`.
- Verified from Windows:
  - `GET http://100.86.175.53:11435/api/version`
  - returned `{"version":"0.30.7"}`
- Verified installed models from `/api/tags`:
  - `qwen3-embedding:0.6b`
  - `qwen3:1.7b`
  - `qwen2.5:7b-instruct-q4_K_M`
- Verified chat inference:
  - model: `qwen3:1.7b`
  - response: `orin endpoint online`
- Verified embedding inference:
  - model: `qwen3-embedding:0.6b`
  - embedding count: `1`
  - dimensions: `1024`

### Validation Performed

- Static checks passed:
```bash
npm run lint
npm run build
```
- Build output confirmed these dynamic routes:
  - `/api/ai/chat`
  - `/api/ai/embed`
  - `/api/ai/health`
- Security scan confirmed client fetches only target:
  - `/api/ai/health`
  - `/api/ai/embed`
  - `/api/ai/chat`
- The raw Nano URL remains in server-side config:
  - `lib/ai/ollama-config.ts`

### Manual Run Commands

Use this from the project directory:

```bash
cd ~/CascadeProjects/websites/luis-ruiz/luis_ruiz_3
npm run dev
```

Then open:

```text
http://localhost:3000
```

Nano health checks:

```bash
tailscale status
curl -sS --max-time 10 http://100.86.175.53:11435/api/version
curl -sS --max-time 10 http://100.86.175.53:11435/api/tags
```

Orin recovery command sequence:

```bash
ssh giosterr44@100.86.175.53
docker restart ollama-gpu
curl -sS --max-time 10 http://localhost:11435/api/version
```

### Current Limitations

- This is browser-local persistence only.
- IndexedDB data is origin-specific.
- Different browsers, devices, or Vercel preview URLs do not share memory.
- Clearing site data deletes chat history and memories.
- Browser storage may remain `best-effort` if persistent storage is not granted.
- There is no server-side user account system in this implementation.
- There is no Supabase persistence in this implementation.
- There is no production HTTPS Nano gateway in this implementation.
- The Vercel/private Tailscale production connectivity issue remains out of scope.
- The chat route uses non-streaming responses.
- The model route sets `think: false` to keep responses simple and avoid empty answer issues caused by thinking-token budgets.
- The retrieval scan is linear over local memories, which is acceptable for the 500-memory cap.

### Implementation TL;DR

The implemented card is a local IndexedDB RAG chat UI backed by a private Orin Nano Ollama endpoint. It proxies all AI calls through Next.js Route Handlers, stores messages and embedding-backed memories locally, reuses exact normalized matches, retrieves semantic matches as untrusted context, logs metadata-only diagnostics, blocks submits when Nano is offline, and uses longer timeout budgets suitable for Orin Nano inference.
