import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyProviderResponse, parseAction, readAlertBody } from "../supabase/functions/site-inquiry-alerts/contracts.ts";

test("provider success requires a usable acceptance ID", () => {
  assert.deepEqual(classifyProviderResponse(200, { id: "known-id" }), { accepted: true, id: "known-id" });
  assert.deepEqual(classifyProviderResponse(200, {}), { accepted: false, retryable: true, code: "provider_unknown_result" });
  assert.equal(classifyProviderResponse(200, { id: "<html>injection</html>" }).accepted, false);
});

test("only transient or uncertain provider responses retry automatically", () => {
  for (const code of [408, 429, 500, 503]) assert.equal(classifyProviderResponse(code, {}).retryable, true);
  assert.equal(classifyProviderResponse(409, { name: "concurrent_idempotent_requests" }).retryable, true);
  assert.deepEqual(classifyProviderResponse(409, { name: "invalid_idempotent_request" }), { accepted: false, retryable: false, code: "payload_conflict" });
  for (const code of [400, 401, 403, 422]) assert.equal(classifyProviderResponse(code, { message: "Sensitive provider content" }).retryable, false);
  assert.equal(JSON.stringify(classifyProviderResponse(422, { message: "Sensitive provider content" })).includes("Sensitive"), false);
});

test("only bounded fixed owner actions are accepted", async () => {
  assert.equal(parseAction({ action: "test", to: "attacker@example.com" }), "test");
  for (const input of [null, [], "test", { action: "send" }, {}]) assert.equal(parseAction(input), null);
  assert.deepEqual(await readAlertBody(new Request("https://example.com", { method: "POST", body: '{"action":"status"}' })), { action: "status" });
  await assert.rejects(readAlertBody(new Request("https://example.com", { method: "POST", body: "x".repeat(513) })), /body_too_large/);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(300)); controller.enqueue(new Uint8Array(300)); controller.close(); } });
  await assert.rejects(readAlertBody(new Request("https://example.com", { method: "POST", body: stream, duplex: "half" })), /body_too_large/);
});
