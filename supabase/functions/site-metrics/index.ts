import { ANALYTICS_BODY_LIMIT, parseMetricPayload } from "../_shared/metrics-contracts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PUBLIC_KEYS = new Set<string>([ANON_KEY]);
try {
  const configured = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
  for (const key of Object.values(configured)) if (typeof key === "string" && key.startsWith("sb_publishable_")) PUBLIC_KEYS.add(key);
} catch { /* Legacy anon key remains the supported deployment fallback. */ }

function allowedOrigin(origin: string | null): origin is string {
  return origin === "https://www.luis-ruiz.com" || origin === "https://luis-ruiz.com"
    || origin === "https://luis-ruiz-3.vercel.app"
    || /^https:\/\/luis-ruiz-3-[a-z0-9]+-ruiztechservices-projects\.vercel\.app$/.test(origin ?? "");
}

function corsHeaders(origin: string): HeadersInit {
  return { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, dnt, sec-gpc", "Access-Control-Max-Age": "3600", "Cache-Control": "no-store" };
}

async function boundedJson(request: Request): Promise<unknown> {
  const size = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(size) || size > ANALYTICS_BODY_LIMIT || !request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > ANALYTICS_BODY_LIMIT) { await reader.cancel(); throw new Error("body_too_large"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

async function rateKey(request: Request): Promise<string> {
  // Hosted Supabase ingress is behind Cloudflare. Never use caller-provided
  // X-Forwarded-For. Missing/malformed trusted header shares a conservative bucket.
  const raw = request.headers.get("cf-connecting-ip") ?? "";
  const candidate = raw.length <= 45 && /^[a-fA-F0-9:.]+$/.test(raw) ? raw : "missing-network";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`site-metrics:${new Date().toISOString().slice(0, 10)}:${candidate}`));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return new Response(null, { status: 405, headers });
  if (!PUBLIC_KEYS.has(request.headers.get("apikey") ?? "")) return new Response(null, { status: 401, headers });
  if (request.headers.get("sec-gpc") === "1" || ["1", "yes"].includes(request.headers.get("dnt") ?? "")) return new Response(null, { status: 204, headers });
  // Public apikey identifies the project, never a user or trusted caller.
  // Authenticated requests are intentionally omitted from visitor measurements.
  const authorization = request.headers.get("authorization");
  if (authorization && authorization !== `Bearer ${ANON_KEY}`) return new Response(null, { status: 204, headers });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return new Response(null, { status: 415, headers });
  try {
    const input = parseMetricPayload(await boundedJson(request));
    if (!input) return new Response(null, { status: 400, headers });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_site_metric`, {
      method: "POST", headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_event_id: input.id, p_event_name: input.event, p_path: input.path, p_rate_key: await rateKey(request) }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return new Response(null, { status: 503, headers });
    const counted = await response.json();
    return new Response(null, { status: counted === true ? 202 : 204, headers });
  } catch {
    // No body, IP, authorization headers, or downstream error text is logged.
    return new Response(null, { status: 400, headers });
  }
});
