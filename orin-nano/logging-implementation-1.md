# Modular Logging + Error Mitigation Plan

## Summary
- Add reusable metadata-only logging for backend Route Handlers and frontend chat flow.
- Show frontend logs in both browser console and a collapsible diagnostics panel inside the card.
- Fix current failures by making `/api/ai/embed` and `/api/ai/chat` always return structured JSON, even on Nano timeout, invalid Ollama JSON, empty Ollama response, or thrown `fetch failed`.
- Keep raw Nano access server-only. Client continues calling only `/api/ai/embed` and `/api/ai/chat`.

## Pseudocode
```text
On frontend action:
  create operation id
  log submit_started
  save user message
  call API with operation id header
  parse API response defensively
  if API error:
    log api_failed with code/status/requestId
    show readable error with request id
    stop
  continue exact-cache / semantic retrieval flow
  log each major step with timings and counts

In API route:
  create request id
  log request_started
  validate request JSON
  call Ollama with timeout
  parse Ollama response defensively
  if timeout/fetch/http/invalid-json/empty result:
    log structured error
    return JSON error envelope
  log request_succeeded with duration
  return JSON success envelope
```

## Key Changes
- Add shared logging utilities:
  - `lib/logging/shared.ts`: log event types, request/operation ID creation, duration helpers, metadata sanitizer, error serializer.
  - `lib/logging/server.ts`: backend JSON console logger and route operation helpers.
  - `lib/logging/client.ts`: browser logger, in-memory ring buffer, subscribe/unsubscribe API, console output.
- Add reusable API helpers:
  - `lib/api/envelope.ts`: success/error response envelope types and builders.
  - `lib/api/safe-json.ts`: safe response parsing that never throws `Unexpected end of JSON input`.
  - `lib/api/fetch-with-timeout.ts`: timeout-controlled server fetch helper.
- Update API contracts:
  - Success responses include `ok: true` and `requestId`.
  - Error responses include `ok: false`, `requestId`, `error.code`, `error.message`, `error.status`, and `error.retryable`.
  - `/api/ai/embed` success still includes `model`, `profileId`, `dimensions`, and `embedding`.
  - `/api/ai/chat` success still includes `answer`.

## Error Mitigations
- Wrap both Route Handlers in `try/catch` so uncaught `fetch failed` becomes structured JSON instead of a generic 500.
- Classify Nano failures:
  - `OLLAMA_CONNECT_TIMEOUT`: Nano unreachable or Tailscale/Docker down.
  - `OLLAMA_FETCH_FAILED`: network failure other than timeout.
  - `OLLAMA_HTTP_ERROR`: Ollama returned non-2xx.
  - `OLLAMA_INVALID_JSON`: Ollama response was not parseable JSON.
  - `OLLAMA_EMPTY_EMBEDDING` / `OLLAMA_EMPTY_ANSWER`: valid JSON but missing useful output.
  - `VALIDATION_ERROR`: bad frontend payload.
- Update frontend request helpers so they:
  - Use `safe-json` parsing.
  - Never surface raw `Unexpected end of JSON input`.
  - Show actionable card errors like: `Embedding failed: Nano connection timed out. Check Tailscale, Docker, and Ollama. Request: abc123`.
- Keep existing `suppressHydrationWarning` on `<html>` and `<body>` for the Scribe extension warning, but note that browser extensions can still mutate DOM outside app control.

## Frontend Diagnostics Panel
- Add a collapsible diagnostics section inside `OrinNanoChatCard`.
- Display recent metadata-only events:
  - timestamp
  - level
  - scope
  - event name
  - operation/request ID
  - duration
  - status/code
  - counts such as `messageCount`, `memoryCount`, `retrievedMemoryCount`
- Do not log full user prompts, answers, embeddings, or raw Nano URLs in the panel.
- Keep detailed logs always enabled, per your choice.

## Test Plan
- Run static checks:
```bash
npm run lint
npm run build
```
- Manual local tests:
```bash
npm run dev
```
- Test normal path:
  - Send a message.
  - Confirm frontend panel logs submit, embed, retrieval, chat, save.
  - Confirm backend terminal logs matching request IDs.
- Test Nano unreachable:
  - Stop or disconnect Nano/Tailscale.
  - Submit a message.
  - Confirm the UI shows a readable timeout/connectivity error, not `Unexpected end of JSON input`.
  - Confirm `/api/ai/embed` returns JSON error envelope, not empty/generic 500.
- Test invalid route:
  - Confirm any old `/api/chat` request remains unrelated; app code should only call `/api/ai/chat`.
- Security check:
```bash
rg -n "100\\.86\\.175\\.53|11435|fetch\\(" app components lib
```
  - Raw Nano URL must remain server-only.
  - Client fetches must target only `/api/ai/embed` and `/api/ai/chat`.

## Assumptions
- Metadata-only logging means no full prompt text, answer text, embeddings, or raw endpoint URLs in logs.
- Detailed logs are always enabled for this local toy app.
- The diagnostics panel is local developer UI, not production observability.
- Production/Vercel logging, auth, gateway hardening, and redaction policies remain out of scope.

## TL;DR
Add reusable shared logging, backend route logging, frontend diagnostics, safe JSON parsing, and structured API error envelopes so Nano timeouts become readable logged failures instead of generic 500s and `Unexpected end of JSON input`.
