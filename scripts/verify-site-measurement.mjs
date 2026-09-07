import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, webcrypto } from "node:crypto";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function compile(file) {
  return ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
function loadModule(file, globals = {}, dependencies = {}) {
  const exports = {};
  const context = vm.createContext({ exports, Date, Set, Map, JSON, Number, TextEncoder, TextDecoder, Uint8Array, crypto: webcrypto,
    Request, Response, Headers, AbortSignal, Event, ...globals, require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    } });
  vm.runInContext(compile(file), context);
  return exports;
}
const contracts = loadModule("supabase/functions/_shared/metrics-contracts.ts");
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test("metric ingress allows only public pathnames and supported event combinations", () => {
  for (const path of ["/", "/projects/gios-soundboard", "/projects/project-with-legacy-trailing-", "/blog/28", "/contact", "/soundboard"]) assert.equal(contracts.publicMetricPath(path), path);
  for (const path of ["/admin", "/dashboard/write/1", "/account", "/auth/callback", "/blog/28?email=secret", "https://example.com", "/projects/%2fprivate", "/projects/../../admin", "/blog/0", "/projects/" + "a".repeat(101)]) assert.equal(contracts.publicMetricPath(path), null);
  const event = { id: randomUUID(), event: "page_view", path: "/about" };
  assert.deepEqual(plain(contracts.parseMetricPayload(event)), event);
  for (const value of [{ ...event, event: "inquiry_submitted" }, { ...event, path: "/", event: "sound_play" }, { ...event, email: "secret" }, { ...event, id: "fake" }, null, []]) assert.equal(contracts.parseMetricPayload(value), null);
});

test("return estimates count only a valid earlier UTC day inside ninety days", () => {
  const now = new Date("2026-09-07T23:59:59Z");
  assert.deepEqual(plain(contracts.returnVisitForDay("2026-09-06", now)), { day: "2026-09-07", returning: true });
  for (const previous of [null, "invalid", "2026-09-07", "2026-09-08", "2026-02-31", "2026-01-01"]) assert.equal(contracts.returnVisitForDay(previous, now).returning, false);
  assert.equal(contracts.returnVisitForDay("2026-09-07", new Date("2026-09-08T00:00:00Z")).returning, true);
});

test("inquiry attribution expires and rejects sensitive or arbitrary values", () => {
  const now = 1_800_000_000_000;
  assert.equal(contracts.parseInquirySource(JSON.stringify({ path: "/projects/gios-soundboard", expires: now + 60_000 }), now), "/projects/gios-soundboard");
  for (const value of ["broken", "null", JSON.stringify({ path: "/dashboard", expires: now + 60_000 }), JSON.stringify({ path: "/", expires: now }), JSON.stringify({ path: "/", expires: now + 31 * 60_000 })]) assert.equal(contracts.parseInquirySource(value, now), null);
});

function browserFixture({ signal = {}, signedIn = false, unavailable = false, rejectWrites = false } = {}) {
  const saved = new Map();
  const storage = { getItem(key) { if (unavailable) throw new Error("blocked"); return saved.get(key) ?? null; }, setItem(key, value) { if (unavailable || rejectWrites) throw new Error("blocked"); saved.set(key, value); }, removeItem(key) { saved.delete(key); } };
  const calls = [];
  const events = new EventTarget();
  events.location = { hostname: "www.luis-ruiz.com" };
  const client = loadModule("lib/analytics/client.ts", { window: events, navigator: signal, localStorage: storage, sessionStorage: storage,
    fetch: async (...args) => { calls.push(args); return new Response(null, { status: 202 }); },
  }, { "./contracts": contracts, "@/lib/supabase/client": { createClient: () => ({ auth: { getSession: async () => ({ data: { session: signedIn ? {} : null }, error: null }) } }) },
    "@/lib/supabase/env": { getSupabasePublishableKey: () => "test-public-key", getSupabaseUrl: () => "https://test.supabase.co" } });
  return { client, saved, calls };
}

test("DNT, GPC, unavailable storage and signed-in sessions never transmit browser measurements", async () => {
  for (const options of [{ signal: { doNotTrack: "1" } }, { signal: { globalPrivacyControl: true } }, { signedIn: true }, { unavailable: true }]) {
    const { client, calls } = browserFixture(options);
    assert.equal(await client.sendPublicMetric("page_view", "/"), false);
    assert.equal(calls.length, 0);
  }
});

test("manual opt-out clears optional markers and blocks transmission while favorites survive", async () => {
  const { client, calls, saved } = browserFixture();
  saved.set(contracts.ANALYTICS_RETURN_KEY, "2026-09-06");
  saved.set(contracts.ANALYTICS_SOURCE_KEY, "source");
  saved.set("soundboard-favorites", "vine-boom");
  assert.equal(client.setMeasurementOptOut(true), true);
  assert.equal(await client.sendPublicMetric("page_view", "/soundboard"), false);
  assert.equal(calls.length, 0);
  assert.equal(saved.has(contracts.ANALYTICS_RETURN_KEY), false);
  assert.equal(saved.has(contracts.ANALYTICS_SOURCE_KEY), false);
  assert.equal(saved.get("soundboard-favorites"), "vine-boom");
});

test("failed opt-in stays off when storage reads work but quota rejects writes", async () => {
  const { client, calls, saved } = browserFixture({ rejectWrites: true });
  saved.set(contracts.ANALYTICS_OPTOUT_KEY, "0");
  saved.set(contracts.ANALYTICS_RETURN_KEY, "2026-09-06");
  saved.set(contracts.ANALYTICS_SOURCE_KEY, "source");
  assert.equal(client.measurementIsAllowed(), true);
  assert.equal(client.setMeasurementOptOut(true), false);
  assert.equal(client.measurementIsAllowed(), false);
  assert.equal(saved.has(contracts.ANALYTICS_RETURN_KEY), false);
  assert.equal(saved.has(contracts.ANALYTICS_SOURCE_KEY), false);
  assert.equal(client.setMeasurementOptOut(false), false);
  assert.equal(client.measurementIsAllowed(), false);
  assert.equal(await client.sendPublicMetric("page_view", "/"), false);
  assert.equal(calls.length, 0);
});

test("browser request contains an event ID and public path, no identity or referrer", async () => {
  const { client, calls } = browserFixture();
  assert.equal(await client.sendPublicMetric("page_view", "/projects/gios-soundboard"), true);
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, "https://test.supabase.co/functions/v1/site-metrics");
  assert.equal(options.credentials, "omit");
  assert.equal(options.referrerPolicy, "no-referrer");
  const body = JSON.parse(options.body);
  assert.deepEqual(Object.keys(body).sort(), ["event", "id", "path"]);
  assert.ok(contracts.parseMetricPayload(body));
});

function edgeFixture() {
  let handler;
  const calls = [];
  loadModule("supabase/functions/site-metrics/index.ts", {
    Deno: { env: { get: (key) => ({ SUPABASE_URL: "https://test.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-server-only-secret", SUPABASE_ANON_KEY: "test-anon-key" }[key]) }, serve: (callback) => { handler = callback; } },
    fetch: async (url, options) => { calls.push([url, options]); return Response.json(true); },
  }, { "../_shared/metrics-contracts.ts": contracts });
  return { handler, calls };
}
function metricRequest(extraHeaders = {}, body = { id: randomUUID(), event: "page_view", path: "/" }) {
  return new Request("https://test.supabase.co/functions/v1/site-metrics", { method: "POST", headers: { origin: "https://www.luis-ruiz.com", apikey: "test-anon-key", "content-type": "application/json", ...extraHeaders }, body: JSON.stringify(body) });
}

test("Edge ingress rejects private routes, unexpected fields, invalid keys, oversized bodies and cross-origin requests before RPC", async () => {
  const { handler, calls } = edgeFixture();
  for (const request of [metricRequest({ origin: "https://attacker.example" }), metricRequest({ apikey: "invalid" }), metricRequest({}, { id: randomUUID(), event: "inquiry_submitted", path: "/" }), metricRequest({}, { id: randomUUID(), event: "page_view", path: "/dashboard" }), metricRequest({}, { payload: "x".repeat(1000) })]) assert.ok((await handler(request)).status >= 400);
  assert.equal(calls.length, 0);
});

test("Edge respects privacy signals and omits authenticated bearer requests", async () => {
  const { handler, calls } = edgeFixture();
  for (const headers of [{ "sec-gpc": "1" }, { dnt: "1" }, { authorization: "Bearer user-token" }]) assert.equal((await handler(metricRequest(headers))).status, 204);
  assert.equal(calls.length, 0);
});

test("Edge forwards only validated metrics with a purpose-separated hashed network key", async () => {
  const { handler, calls } = edgeFixture();
  const id = randomUUID();
  assert.equal((await handler(metricRequest({ "cf-connecting-ip": "203.0.113.5", "x-forwarded-for": "spoofed" }, { id, event: "sound_play", path: "/soundboard" }))).status, 202);
  const [url, options] = calls[0];
  assert.equal(url, "https://test.supabase.co/rest/v1/rpc/record_site_metric");
  const body = JSON.parse(options.body);
  assert.equal(body.p_event_id, id);
  assert.equal(body.p_event_name, "sound_play");
  assert.match(body.p_rate_key, /^[a-f0-9]{64}$/);
  assert.ok(!options.body.includes("203.0.113.5"));
  assert.ok(!options.body.includes("spoofed"));
  assert.ok(!options.body.includes("test-server-only-secret"));
});
