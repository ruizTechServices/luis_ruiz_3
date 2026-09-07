import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const payload = { request_id: "12345678-1234-4123-8123-123456789abc", full_name: "  Example Visitor  ", email: "  VISITOR@example.invalid  ", subject: "Build a website or app", message: "A useful project inquiry for verification.", budget: "", timeline: "", website_url: "", measurement_allowed: true, source_path: "/projects/gios-soundboard" };
const origin = "https://www.luis-ruiz.com";

// Execute the real Edge source; only the Deno entrypoint/environment and network boundary are replaced.
function harness(respond = () => Response.json({ status: "accepted" })) {
  let handler;
  const calls = [];
  const cache = new Map();
  const environment = { SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-service-key", SUPABASE_ANON_KEY: "test-public-key" };
  const globals = { Request, Response, Headers, ReadableStream, TextEncoder, TextDecoder, AbortSignal, crypto: webcrypto, Deno: { env: { get: (name) => environment[name] }, serve: (callback) => { handler = callback; } }, fetch: async (url, options) => {
    const call = { name: String(url).split("/").at(-1), body: JSON.parse(options.body), headers: options.headers };
    calls.push(call);
    return respond(call);
  } };
  function load(filename) {
    const absolute = path.resolve(filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const compiledModule = { exports: {} };
    cache.set(absolute, compiledModule);
    const code = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const execute = vm.runInNewContext(`(function(require, exports, module) {${code}\n})`, globals, { filename: absolute });
    execute((name) => { if (!name.startsWith(".")) throw new Error(`Unexpected external import: ${name}`); return load(path.resolve(path.dirname(absolute), name)); }, compiledModule.exports, compiledModule);
    return compiledModule.exports;
  }
  const validation = load(path.join(root, "supabase/functions/_shared/inquiry-validation.ts"));
  load(path.join(root, "supabase/functions/site-inquiries/index.ts"));
  return { handler, calls, validation };
}

function request(body = payload, headers = {}, method = "POST") {
  return new Request("https://example.invalid/functions/v1/site-inquiries", { method, headers: { origin, apikey: "test-public-key", "content-type": "application/json", "cf-connecting-ip": "192.0.2.12", ...headers }, ...(method === "POST" ? { body: JSON.stringify(body) } : {}) });
}

test("actual validator normalizes contact fields and strips nonpublic attribution", () => {
  const { validation } = harness();
  const result = validation.validateInquiry(payload);
  assert.equal(result.ok, true);
  assert.equal(result.payload.full_name, "Example Visitor");
  assert.equal(result.payload.email, "visitor@example.invalid");
  for (const source of ["/dashboard", "/admin/inquiries", "/account", "/projects/a?email=private", "/projects/a#private", "/projects/%2e%2e", "//example.com", "https://example.com", "/blog/0", "/blog/12345678901234"]) assert.equal(validation.validateInquiry({ ...payload, source_path: source }).payload.source_path, null);
  for (const source of ["/", "/contact", "/soundboard", "/projects/a-real-project", "/blog/28"]) assert.equal(validation.validateInquiry({ ...payload, source_path: source }).payload.source_path, source);
  assert.equal(validation.validateInquiry({ ...payload, measurement_allowed: false }).payload.source_path, null);
  assert.equal(validation.validateInquiry({ ...payload, measurement_allowed: "true" }).measurementAllowed, false);
});

test("contact validation rejects field injection, missing fields and unbounded input", () => {
  const { validation } = harness();
  for (const value of [null, [], { ...payload, request_id: "unsafe" }, { ...payload, email: "x\r\nBcc:other@example.com" }, { ...payload, full_name: "Example\u0000Visitor" }, { ...payload, subject: "arbitrary" }, { ...payload, message: "short" }, { ...payload, message: "x".repeat(5001) }, { ...payload, budget: "x".repeat(121) }, { ...payload, timeline: null }]) assert.equal(validation.validateInquiry(value).ok, false);
});

test("Edge checks origins, methods, public app key and content type before RPC calls", async () => {
  const value = harness();
  assert.equal((await value.handler(request(payload, { origin: "https://www.luis-ruiz.com.attacker.invalid" }))).status, 403);
  assert.equal((await value.handler(request(payload, { apikey: "wrong" }))).status, 401);
  assert.equal((await value.handler(request(payload, { "content-type": "text/plain" }))).status, 415);
  assert.equal((await value.handler(request(payload, {}, "GET"))).status, 405);
  const preflight = await value.handler(request(payload, {}, "OPTIONS"));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal(value.calls.length, 0);
});

test("bounded parser rejects streamed overflow, false lengths and invalid UTF-8", async () => {
  const { validation } = harness();
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(10_000)); controller.enqueue(new Uint8Array(10_000)); controller.close(); } });
  await assert.rejects(validation.boundedJson(new Request("https://example.invalid", { method: "POST", body: stream, duplex: "half" })), /too_large/);
  for (const length of ["-1", "nonsense", "20000"]) await assert.rejects(validation.boundedJson(new Request("https://example.invalid", { method: "POST", headers: { "content-length": length }, body: "{}" })), /too_large/);
  await assert.rejects(validation.boundedJson(new Request("https://example.invalid", { method: "POST", body: new Uint8Array([255]) })));
});

test("honeypot returns normal success without saving, queueing or measuring", async () => {
  const value = harness();
  const result = await value.handler(request({ ...payload, website_url: "https://spam.invalid" }));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "success");
  assert.equal(value.calls.length, 0);
});

test("accepted inquiry sends normalized payload and only opaque rate keys to RPC", async () => {
  const value = harness();
  const result = await value.handler(request());
  assert.equal(result.status, 200);
  assert.deepEqual(value.calls.map((call) => call.name), ["accept_site_inquiry", "record_site_metric"]);
  const body = value.calls[0].body;
  assert.equal(body.p_payload.email, "visitor@example.invalid");
  assert.equal(body.p_payload.source_path, payload.source_path);
  for (const key of ["p_network_key", "p_email_key", "p_fingerprint"]) assert.match(body[key], /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(body).includes("192.0.2.12"), false);
  assert.equal(value.calls[1].body.p_event_name, "inquiry_submitted");
  assert.equal(value.calls[1].body.p_path, payload.source_path);
  assert.equal((await result.text()).includes("test-service-key"), false);
});

test("DNT, GPC and opt-out remove attribution before insertion and skip metrics", async () => {
  for (const [body, headers] of [[payload, { dnt: "1" }], [payload, { "sec-gpc": "1" }], [{ ...payload, measurement_allowed: false }, {}]]) {
    const value = harness();
    const result = await value.handler(request(body, headers));
    assert.equal(result.status, 200);
    assert.equal(value.calls[0].body.p_payload.source_path, null);
    assert.deepEqual(value.calls.map((call) => call.name), ["accept_site_inquiry"]);
  }
});

test("attribution changes do not bypass payload deduplication and spoofed XFF cannot change buckets", async () => {
  const value = harness(() => Response.json({ status: "duplicate" }));
  await value.handler(request(payload, { "x-forwarded-for": "198.51.100.1" }));
  await value.handler(request({ ...payload, source_path: "/blog/28" }, { "x-forwarded-for": "198.51.100.2" }));
  assert.equal(value.calls[0].body.p_fingerprint, value.calls[1].body.p_fingerprint);
  assert.equal(value.calls[0].body.p_network_key, value.calls[1].body.p_network_key);
  assert.equal(value.calls.length, 2);
});

test("duplicate, conflict, rate limit and database failures never count as new conversions", async () => {
  for (const [status, expected] of [["duplicate", 200], ["conflict", 409], ["rate_limited", 429], ["unknown", 503]]) {
    const value = harness(() => Response.json({ status }));
    const response = await value.handler(request());
    assert.equal(response.status, expected);
    assert.equal(value.calls.length, 1);
  }
  const failed = harness(() => Response.json({ message: "internal database content" }, { status: 500 }));
  const response = await failed.handler(request());
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes("internal database"), false);
});

test("measurement outage cannot turn a stored inquiry into a failed submission", async () => {
  const value = harness((call) => { if (call.name === "record_site_metric") throw new Error("Metrics unavailable"); return Response.json({ status: "accepted" }); });
  const result = await value.handler(request());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "success");
});
