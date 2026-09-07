import { allowedInquiryOrigin, boundedJson, validateInquiry } from "../_shared/inquiry-validation.ts";

const apiUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string;
const publicKeys = new Set([Deno.env.get("SUPABASE_ANON_KEY"), ...Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"))].filter((key): key is string => typeof key === "string" && key.length > 0));
const success = { status: "success", message: "Your project note is in my inbox. I’ll review the details and follow up by email about the next step." };

async function digest(scope: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(serviceKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${scope}:${value}`)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function rpc(name: string, body: Record<string, unknown>, timeout = 12_000) {
  return fetch(`${apiUrl}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Origin", ...(allowedInquiryOrigin(origin) ? { "Access-Control-Allow-Origin": origin!, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } : {}) };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!allowedInquiryOrigin(origin)) return reply({ status: "error", message: "Open the contact form on luis-ruiz.com." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply({ status: "error", message: "Method not supported." }, 405);
  // The publishable key identifies this public application. It is not a secret or a spam filter.
  if (!publicKeys.has(request.headers.get("apikey") ?? "")) return reply({ status: "error", message: "Refresh the form and try again." }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply({ status: "error", message: "Send a valid project note." }, 415);
  try {
    const parsed = validateInquiry(await boundedJson(request));
    if (!parsed.ok) return reply({ status: "error", message: parsed.message }, 400);
    if (parsed.honeypot) return reply(success);
    const day = new Date().toISOString().slice(0, 10);
    // Cloudflare overwrites this at its ingress. Never trust a submitted address or the first X-Forwarded-For value.
    const remote = request.headers.get("cf-connecting-ip");
    const network = remote && remote.length <= 45 && /^[0-9a-f:.]+$/i.test(remote) ? remote : "unknown-network";
    const measurementAllowed = parsed.measurementAllowed && !["1", "yes"].includes(request.headers.get("dnt")?.toLowerCase() ?? "") && request.headers.get("sec-gpc") !== "1";
    const payload = { ...parsed.payload, source_path: measurementAllowed ? parsed.payload.source_path : null };
    const networkKey = await digest(`inquiry-network-${day}`, network);
    const emailKey = await digest(`inquiry-email-${day}`, payload.email);
    const fingerprint = await digest("inquiry-payload", JSON.stringify({ ...payload, source_path: null }));
    const response = await rpc("accept_site_inquiry", { p_request_id: parsed.requestId, p_payload: payload, p_network_key: networkKey, p_email_key: emailKey, p_fingerprint: fingerprint });
    if (!response.ok) return reply({ status: "error", message: "Your note couldn’t be saved. Your details are still here—please try again shortly." }, 503);
    const result = await response.json();
    if (result.status === "rate_limited") return reply({ status: "error", message: "A few notes have arrived recently. Please wait before sending another; your details are still here." }, 429);
    if (result.status === "conflict") return reply({ status: "error", message: "This form has changed. Edit your note and try again." }, 409);
    if (!["accepted", "duplicate"].includes(result.status)) return reply({ status: "error", message: "Your note couldn’t be saved. Please try again shortly." }, 503);
    if (result.status === "accepted" && measurementAllowed) {
      // Conversion counts come only from successful insertion, never from a client-supplied success event.
      await rpc("record_site_metric", { p_event_id: parsed.requestId, p_event_name: "inquiry_submitted", p_path: payload.source_path || "/contact", p_rate_key: await digest(`metrics-${day}`, network) }, 2_000).catch(() => null);
    }
    return reply(success);
  } catch {
    // Never log request bodies, contact details, raw network addresses or credentials.
    return reply({ status: "error", message: "Your note couldn’t be processed. Keep it here and try again shortly." }, 400);
  }
});
