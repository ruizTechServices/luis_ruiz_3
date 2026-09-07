import { classifyProviderResponse, parseAction, readAlertBody } from "./contracts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")?.trim();
const ALERT_FROM = Deno.env.get("INQUIRY_ALERT_FROM")?.trim();
const CONFIGURED = Boolean(RESEND_KEY && ALERT_FROM && ALERT_FROM.length <= 320 && !/[\r\n]/.test(ALERT_FROM));

type QueueItem = { id: string; lease_token: string; provider_payload: Record<string, unknown> };

async function rpc<T>(name: string, body: Record<string, unknown> = {}, jwt = SERVICE_KEY): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: jwt === SERVICE_KEY ? SERVICE_KEY : ANON_KEY, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("database_unavailable");
  return await response.json() as T;
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

async function processBatch(recipient: string, testId: string | null) {
  const jobs = await rpc<QueueItem[]>("claim_inquiry_alerts", { p_from: ALERT_FROM, p_recipient: recipient, p_test_id: testId });
  let accepted = 0;
  for (const job of jobs) {
    let result;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `luis-inquiry/${job.id}` },
        body: JSON.stringify(job.provider_payload), signal: AbortSignal.timeout(12_000),
      });
      let body: unknown = null;
      try { body = await response.json(); } catch { /* Treat an unclear provider result as retryable, with the same key. */ }
      result = classifyProviderResponse(response.status, body);
    } catch {
      result = { accepted: false as const, retryable: true, code: "provider_unknown_result" };
    }
    // A worker crash leaves the lease to expire; the next worker uses exactly the
    // same stored payload and idempotency key. Never log provider bodies or tokens.
    const recorded = await rpc<boolean>("finish_inquiry_alert", {
      p_id: job.id, p_lease_token: job.lease_token, p_accepted: result.accepted,
      p_provider_id: result.accepted ? result.id : null,
      p_error_code: result.accepted ? null : result.code,
      p_retryable: result.accepted ? false : result.retryable,
    });
    if (result.accepted && recorded) accepted += 1;
  }
  return { attempted: jobs.length, accepted };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Use JSON." }, 415);
  try {
    const cronToken = request.headers.get("x-inquiry-cron-token");
    let isCron = false;
    if (cronToken && /^[a-f0-9]{64}$/.test(cronToken)) {
      isCron = await rpc<boolean>("verify_inquiry_alert_cron", { p_token: cronToken });
    }
    if (!isCron) {
      const authorization = request.headers.get("authorization") ?? "";
      const jwt = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
      if (!jwt || jwt === ANON_KEY || jwt === SERVICE_KEY || jwt.length > 8192) return json({ error: "Sign in as the site owner." }, 401);
      let owner = false;
      try { owner = await rpc<boolean>("is_gio_admin", {}, jwt); } catch { /* Invalid or expired JWT. */ }
      if (!owner) return json({ error: "Only the site owner can manage alerts." }, 403);
    }
    const action = parseAction(await readAlertBody(request));
    if (!action || (isCron && action !== "process")) return json({ error: "Invalid alert action." }, 400);
    const recipient = await rpc<string | null>("inquiry_alert_recipient");
    const configured = CONFIGURED && Boolean(recipient);
    await rpc("record_inquiry_alert_configuration", { p_configured: configured, p_worker_tick: action === "process" });
    let message = "";
    if (action !== "status") {
      if (!configured) {
        await rpc("hold_unconfigured_inquiry_alerts");
        message = "Email alerts need setup. Your inquiries are safely saved in this inbox.";
      } else {
        let testId: string | null = null;
        if (action === "test") {
          testId = await rpc<string | null>("queue_inquiry_alert_test");
          if (!testId) return json({ error: "Wait one minute before sending another test." }, 429);
        }
        const result = await processBatch(recipient!, testId);
        message = result.accepted > 0
          ? `${result.accepted} ${result.accepted === 1 ? "email accepted" : "emails accepted"} by the provider. Check your inbox or spam folder; delivery is not yet confirmed.`
          : result.attempted > 0 ? "The provider did not confirm acceptance. Check the alert status below." : "No pending alerts are due for retry yet.";
      }
    }
    const status = await rpc<Record<string, unknown>>("inquiry_alert_status");
    return json({ ...status, configured, missing: [!RESEND_KEY ? "RESEND_API_KEY" : null, !ALERT_FROM ? "INQUIRY_ALERT_FROM" : null, !recipient ? "Confirmed owner account" : null].filter(Boolean), message });
  } catch {
    return json({ error: "Email alert status is unavailable. Your saved inquiries are unaffected; try again shortly." }, 503);
  }
});
