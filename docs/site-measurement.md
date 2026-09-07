# Site measurement

The owner report is `/dashboard/insights`. It shows 7-, 30-, or 90-day totals, project attention, inquiry source pages, sound starts, and estimated soundboard return visits. Counts begin with this feature; no historical traffic is invented or imported.

## Collection

- Only signed-out browsers on `www.luis-ruiz.com` or `luis-ruiz.com` collect optional metrics. Preview deployments and private routes do not collect through the site client.
- `SiteMeasurement` records a public pathname once when it becomes visible during navigation. Paths are validated again at the Edge Function and against published database content in the ingestion function.
- The player reports an actual successful new or restarted sound; resuming a paused sound is excluded. The client ignores starts less than 750 ms apart.
- Return detection keeps one UTC date in local storage. A later-day visit within 90 days can send a return signal, normally once per browser that day. The marker is updated before sending; a failed send can undercount, and simultaneous tabs can race. No persistent browser ID is transmitted. Clearing storage, private browsing, another device and blocked requests can alter the estimate. It is not a unique-person count.
- A tab remembers its last non-contact public path for 30 minutes. The successful inquiry handler may use this as attribution when optional measurement is enabled; direct or unavailable attribution uses `/contact`. The public metric endpoint never accepts an inquiry conversion event.
- Global Privacy Control, Do Not Track and the manual measurement preference disable collection. Unavailable browser storage also disables collection. Opting out clears the optional return/source markers and preserves soundboard favorites.

`MeasurementPrivacyControl` provides the public preference checkbox. `measurementIsAllowed()` and `getInquirySource()` provide the contact-form integration. Server/Edge contact handling must honor the consent flag plus the request's GPC/DNT headers, and must record conversion only after a successful write. Metric failures must not fail an otherwise saved inquiry.

## Data and access

`site_metrics_daily` stores only a UTC day, supported event name, public pathname and count. No contact content, email, user ID, user agent, query string, referrer, or raw IP enters the measurement tables. The browser uses `referrerPolicy: no-referrer` and omits cookies for the Supabase request. Hosting providers' operational logs are separate from these application tables.

`site-metrics` is an intentionally public Supabase Edge Function, using the existing project's built-in service credential only on the server. Browser access presents an allowed publishable/legacy anon key; that key and CORS do not establish a trusted visitor. The endpoint validates JSON with a streaming 768-byte cap, rejects unsupported routes/events, and calls `record_site_metric(uuid,text,text,text)`. That database RPC uses SECURITY INVOKER and is executable only by `service_role`; anonymous and authenticated callers cannot bypass the Edge ingress by invoking it themselves.

The Edge Function uses Cloudflare's `cf-connecting-ip` only as a best-effort network quota input. It never accepts an IP in the payload or reads `x-forwarded-for`. Absent or malformed CF headers share a conservative bucket. The input is purpose-separated and HMAC-hashed with the server credential and UTC date before database use. Do not log headers, bodies or credentials. This requires direct hosted Supabase ingress; revisit the proxy trust assumptions before introducing another proxy.

Atomic database quotas cap accepted attempts at 120/minute and 1,000/day per hashed network and 20,000/day overall. Event UUIDs deduplicate retries. Limits constrain stored data even if event origins or network hints are manipulated. They do not guarantee bot detection or prevent all Edge invocation costs, and counts can be lower during limits/outages.

Only verified Gio can read aggregates and call `site_metrics_summary(integer)`, using the existing owner helper and RLS. The report never uses a server credential.

## Retention and deployment

- Retain 90 UTC days of aggregates, counting today. Deduplication records and network quota hashes expire after 48 hours.
- `purge_site_metrics()` deletes expired records. Supabase Cron job `luis-site-metrics-retention` runs daily at 03:17 UTC; ingestion also runs cleanup on the first valid attempt each UTC day. Cleanup removes records older than the cutoff on its next run, rather than at an exact expiry instant.
- Deploy `supabase/functions/site-metrics/index.ts` with `_shared/metrics-contracts.ts`. It supports legacy anonymous JWTs and publishable keys through an explicit API-key allowlist. For publishable keys, deploy with gateway `verify_jwt = false`; the function's key checks remain required. Legacy clients include a Bearer anon key too.
- Built-in secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, optional `SUPABASE_PUBLISHABLE_KEYS`. No new Vercel secret or third-party analytics subscription is required.
- Replace the earlier unconditional Vercel Analytics component to avoid a second collector outside these preferences. Keep the dependency only if another feature still uses it; removing an unused package is optional.

## Verification

Run `node --test scripts/verify-site-measurement.mjs` for actual client/Edge request validation, auth/privacy exclusions, safe attribution and return-date behavior. Run `supabase/tests/site_measurement_access.sql` against the migrated database: it exercises role grants/RLS, accepted ingestion, replay refusal, all three quota layers and retention inside a rolled-back transaction.

After deployment, verify one signed-out production page view reaches its aggregate, a signed-in owner visit is omitted, the report loads only for Gio, and the daily purge job exists. Do not simulate old visitors or historical growth in production to populate the report.
