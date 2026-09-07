import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadModule(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(compiled.outputText, { exports, require: (name) => imports[name] ?? require(name) });
  return exports;
}

const types = loadModule("../lib/inquiries/types.ts");
const validation = loadModule("../lib/inquiries/validation.ts", { "@/lib/inquiries/types": types });
const input = { id: 18, expectedUpdatedAt: "2026-09-07T12:34:56.123456+00:00", status: "contacted", followUpAt: "2026-09-10T10:00:00-04:00", internalNotes: "Asked for a scope." };

test("follow-up updates reject identity edits, unknown statuses, malformed dates, and oversized notes", () => {
  assert.equal(validation.inquiryUpdateSchema.safeParse(input).success, true);
  assert.equal(validation.inquiryUpdateSchema.safeParse({ ...input, followUpAt: null, internalNotes: "" }).success, true);
  for (const bad of [
    { ...input, email: "somebody@example.com" },
    { ...input, message: "Replacement submission" },
    { ...input, status: "admin" },
    { ...input, id: -1 },
    { ...input, expectedUpdatedAt: "" },
    { ...input, followUpAt: "2026-09-10T10:00" },
    { ...input, followUpAt: "2026-02-30T10:00:00Z" },
    { ...input, internalNotes: "x".repeat(10_001) },
  ]) assert.equal(validation.inquiryUpdateSchema.safeParse(bad).success, false);
});

test("closed and unscheduled inquiries stay out of the due queue", () => {
  const now = Date.parse("2026-09-07T12:00:00Z");
  for (const status of ["new", "contacted", "qualified"]) {
    assert.equal(types.isInquiryDue({ status, follow_up_at: "2026-09-07T11:00:00Z" }, now), true);
    assert.equal(types.isInquiryDue({ status, follow_up_at: "2026-09-07T12:00:00Z" }, now), true);
    assert.equal(types.isInquiryDue({ status, follow_up_at: "2026-09-07T13:00:00Z" }, now), false);
    assert.equal(types.isInquiryDue({ status, follow_up_at: null }, now), false);
  }
  for (const status of ["won", "lost", "spam"]) assert.equal(types.isInquiryDue({ status, follow_up_at: "2026-09-07T11:00:00Z" }, now), false);
});

test("filter and record parameters accept only known views and positive safe integers", () => {
  assert.equal(validation.parseInquiryView("spam"), "spam");
  assert.equal(validation.parseInquiryView("due"), "due");
  assert.equal(validation.parseInquiryView("all"), "all");
  for (const value of ["status.eq.won", ["new", "spam"], undefined, ""]) assert.equal(validation.parseInquiryView(value), "active");
  assert.equal(validation.parsePositiveInteger("18"), 18);
  for (const value of ["0", "-1", "1.2", "1e3", " 18", "9007199254740992", ["18"], undefined]) assert.equal(validation.parsePositiveInteger(value), null);
});

test("email reply links preserve legitimate plus aliases and cannot introduce extra headers", () => {
  const href = validation.inquiryReplyHref("owner+project@example.com", "Website & dashboard");
  assert.equal(href, "mailto:owner%2Bproject%40example.com?subject=Re%3A%20Website%20%26%20dashboard");
  for (const value of [null, "invalid", "hello@example.com?bcc=intruder@example.com", "hello@example.com\r\nBcc: intruder@example.com"]) assert.equal(validation.inquiryReplyHref(value, "Hello"), null);
  assert.ok(!validation.inquiryReplyHref("hello@example.com", "Hello&bcc=intruder@example.com").includes("&bcc="));
  assert.ok(!validation.inquiryReplyHref("hello@example.com", "Hello\r\nBcc: intruder@example.com").includes("%0"));
});
