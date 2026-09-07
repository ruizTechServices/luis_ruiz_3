# Inquiry email alerts

New public contact submissions are saved with a notification in the same database transaction. Historical inquiries are not backfilled. The `site-inquiry-alerts` Supabase Edge Function checks the queue every minute through `pg_cron` and `pg_net`; provider outages never discard the inquiry itself.

## Connect the provider

The sending service is Resend. Add a sender domain to your own Resend account and complete its DNS verification. Store these **Supabase Edge Function secrets**, not public Next.js variables:

- `RESEND_API_KEY`: a Resend key allowed to send from the verified domain.
- `INQUIRY_ALERT_FROM`: the sender address permitted by that account, optionally `Luis Ruiz <address@verified-domain>`.

In [Resend Domains](https://resend.com/domains), add an owned domain and copy the supplied DNS records into its DNS provider, then wait for verified status. In [Resend API Keys](https://resend.com/api-keys), create a sending key restricted to that domain. Open [this project's Edge Function Secrets](https://supabase.com/dashboard/project/huyhgdsjpdjzokjwaspb/functions/secrets), enter the two names above with their values, and save. Enter secret values directly in Supabase, not in chat. Supabase makes updated secrets available without redeploying the function.

No account or domain is assumed to be verified. Without both values the dashboard says setup is required, and pending notifications remain saved. After connecting, use Dashboard → Inquiries → Refresh status → Send me a test. “Provider accepted” means Resend accepted the send request, not inbox delivery; check the recipient inbox and spam folder. There is no delivery webhook in this implementation.

The only recipient is the confirmed, active Gio owner email in `auth.users`. Neither the browser nor the contact submitter can supply a recipient. Emails contain a generic subject and private inquiry link, without names, client email addresses, message bodies, or attachments. No client autoresponder is sent.

## Retry behavior

The queue claims at most three messages with row locks and a two-minute lease. It stores a fixed provider payload at first send and always reuses that payload and the notification UUID as Resend's idempotency key. Transient failures use exponential backoff (one minute, two, four, eight, sixteen) with a maximum of six attempts. Owner “Process due alerts” observes the same backoff and leases. A lost worker can be recovered after its lease expires. This control does not requeue permanent rejections or alerts marked “Needs review”; those need provider log review first.

Resend's idempotency retention is 24 hours. This worker stops automatic retries at 23 hours from the first attempt and marks the row “Needs review.” It also stops on conflicting provider payloads, permanent provider rejections, and the attempt limit. Investigate Resend logs before any manual replay; never clear a sent row or change its idempotency key just to force a resend. Correct rejected sender credentials before investigating the queue. `sent` in the table means provider acceptance only.

Test alerts use the same durable queue and permit at most one test enqueue per minute, enforced in the database. Test messages count in dashboard totals. They contain no inquiry data.

## Security and operations

Deploy the Edge Function with `verify_jwt = false`: it verifies either the owner's actual Supabase JWT using `is_gio_admin()`, or a private cron credential. This does not make sending public. Anonymous and non-owner calls are rejected before queue work. The Next.js owner endpoint also verifies sign-in and Gio authorization; POST actions require the same origin. No service key is available in or required by Vercel.

The cron credential is randomly generated inside the migration and stored in Vault. No API returns it. A fixed private verification helper is exposed only through a service-role-only SECURITY INVOKER RPC. Owner/browser roles can read their alert queue through RLS but cannot mutate it or call worker RPCs directly. Privileged helpers have an empty search path, fixed queries, and revoked PUBLIC execution. Do not log provider bodies, authorization headers, secrets, or client inquiry content.

`inquiry_alert_configuration.worker_checked_at` distinguishes scheduled worker activity from a manual dashboard status check. The cron command contains no credential. Stop the single `luis-inquiry-alerts` cron job if needed; leave shared database extensions intact.

Verification commands:

```sh
node --test scripts/verify-inquiry-alerts.mjs
```

Run `supabase/tests/inquiry_alerts.sql` after the migration. Its transaction rolls back all synthetic records and performs no provider requests. The real acceptance check requires a configured sender and the owner's “Send me a test” action.

References: [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [Supabase scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions).
