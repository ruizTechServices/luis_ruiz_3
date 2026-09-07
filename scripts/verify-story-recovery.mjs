import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(path.join(tmpdir(), "luis-ruiz-story-recovery-"));
const source = readFileSync(path.join(root, "lib/editor/recovery.ts"), "utf8");
writeFileSync(path.join(temporary, "recovery.js"), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
const { StoryRecovery, parseRecovery, listRecovery, recoveryConflicts, recoveryPrefix, MAX_RECOVERY_LENGTH, RECOVERY_DELAY_MS } = createRequire(import.meta.url)(path.join(temporary, "recovery.js"));
after(() => rmSync(temporary, { recursive: true, force: true }));

const ownerId = "11111111-1111-4111-8111-111111111111";
const otherOwnerId = "22222222-2222-4222-8222-222222222222";
const fields = { title: "A real draft", summary: "Subtitle", body: "Private writing", tags: "Web development", references: "Source notes" };
const empty = { title: "", summary: "", body: "", tags: "", references: "" };
const initialDate = "2026-09-07T12:00:00.000Z";
let sequence = 0;
const randomId = () => `aaaaaaaa-aaaa-4aaa-8aaa-${(++sequence).toString().padStart(12, "0")}`;

class MemoryStorage {
  values = new Map();
  rejectReads = false;
  rejectWrites = false;
  rejectRemovals = false;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { if (this.rejectReads) throw new Error("Blocked"); return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.rejectWrites) throw new Error("Quota exceeded"); this.values.set(key, value); }
  removeItem(key) { if (this.rejectRemovals) throw new Error("Blocked"); this.values.delete(key); }
}

function controller(storage, overrides = {}) {
  const value = new StoryRecovery({ scope: { ownerId, storyId: 28 }, fields, serverSavedAt: initialDate, storage: () => storage, randomId, now: () => new Date(initialDate), ...overrides });
  value.initialize();
  return value;
}

function savedStory(overrides = {}) {
  return { ...fields, id: 28, status: "draft", updated_at: "2026-09-07T12:05:00.000Z", created_at: initialDate, published_at: null, ...overrides };
}

test("reload offers the exact local text without replacing the account version", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  const edited = { ...fields, body: "Unsubmitted writing\nwith precise whitespace  " };
  first.change(edited);
  first.flush();
  const reloaded = controller(storage);
  assert.equal(reloaded.getSnapshot().savedFields, null);
  assert.equal(reloaded.getSnapshot().entries.length, 1);
  assert.deepEqual(reloaded.restore(reloaded.getSnapshot().entries[0]), edited);
  reloaded.flush();
  assert.equal(reloaded.getSnapshot().savedFields, JSON.stringify(edited));
  assert.equal(recoveryConflicts(reloaded.getSnapshot().entries[0]?.copy ?? JSON.parse([...storage.values.values()][0]), initialDate), false);
});

test("debounced changes keep only this editor's latest revision", async () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "First keystrokes" });
  value.change({ ...fields, body: "The final writing" });
  assert.equal(storage.length, 0);
  await new Promise((resolve) => setTimeout(resolve, RECOVERY_DELAY_MS + 50));
  assert.equal(storage.length, 1);
  assert.equal(JSON.parse([...storage.values.values()][0]).fields.body, "The final writing");
  value.change({ ...fields, body: "A later edit" });
  value.flush();
  assert.equal(storage.length, 1);
  assert.equal(JSON.parse([...storage.values.values()][0]).fields.body, "A later edit");
});

test("account and story scopes reject unrelated private writing", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  first.change({ ...fields, body: "Owner's private text" });
  first.flush();
  const raw = [...storage.values.values()][0];
  assert.equal(parseRecovery(raw, { ownerId: otherOwnerId, storyId: 28 }), null);
  assert.equal(parseRecovery(raw, { ownerId, storyId: 29 }), null);
  assert.equal(controller(storage, { scope: { ownerId: otherOwnerId, storyId: 28 } }).getSnapshot().entries.length, 0);
  assert.equal(controller(storage, { scope: { ownerId, storyId: 29 } }).getSnapshot().entries.length, 0);
  assert.throws(() => recoveryPrefix({ ownerId: "../other-user", storyId: 28 }));
});

test("untrusted recovery data is versioned, bounded, and fully validated", () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "Changed" });
  value.flush();
  const raw = [...storage.values.values()][0];
  const valid = JSON.parse(raw);
  const scope = { ownerId, storyId: 28 };
  for (const malformed of ["not JSON", "null", "[]", "x".repeat(MAX_RECOVERY_LENGTH + 1), JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, savedAt: "yesterday" }), JSON.stringify({ ...valid, serverSavedAt: null }), JSON.stringify({ ...valid, fields: { ...fields, body: "x".repeat(100_001) } }), JSON.stringify({ ...valid, fields: { ...fields, tags: null } })]) assert.equal(parseRecovery(malformed, scope), null);
  assert.deepEqual(parseRecovery(raw, scope).fields, { ...fields, body: "Changed" });
});

test("a newer account version is reported as a recovery conflict", () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "Local changes" });
  value.flush();
  const reloaded = controller(storage, { serverSavedAt: "2026-09-07T14:00:00.000Z" });
  const entry = reloaded.getSnapshot().entries[0];
  assert.equal(recoveryConflicts(entry.copy, "2026-09-07T14:00:00.000Z"), true);
  assert.equal(reloaded.getSnapshot().savedFields, null);
  assert.equal(storage.length, 1);
});

test("parallel tabs never overwrite or clear each other's newer revisions", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  const second = controller(storage);
  first.change({ ...fields, body: "Tab one" });
  second.change({ ...fields, body: "Tab two" });
  first.flush();
  second.flush();
  assert.equal(storage.length, 2);
  second.refresh();
  const selected = second.getSnapshot().entries[0];
  assert.equal(second.restore(selected).body, "Tab one");
  second.flush();
  first.change({ ...fields, body: "Tab one's newer revision" });
  first.flush();
  second.confirmServerSave(savedStory({ body: "Tab one" }));
  const remainingBodies = [...storage.values.values()].map((raw) => JSON.parse(raw).fields.body);
  assert.ok(remainingBodies.includes("Tab one's newer revision"));
  assert.ok(remainingBodies.includes("Tab two"), "Switching recovery keeps unsaved editor text as its own copy");
});

test("discard removes only the selected immutable copy and stale restore fails safely", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  const second = controller(storage);
  first.change({ ...fields, body: "One" });
  second.change({ ...fields, body: "Two" });
  first.flush();
  second.flush();
  const viewer = controller(storage);
  const selected = viewer.getSnapshot().entries[0];
  viewer.discard(selected);
  assert.equal(storage.length, 1);
  assert.equal(viewer.getSnapshot().entries.length, 1);
  assert.equal(viewer.restore(selected), null);
  assert.match(viewer.getSnapshot().error, /changed or was removed/);
});

test("new story reload recovers and successful assignment clears just its own new-story copies", () => {
  const storage = new MemoryStorage();
  const newOptions = { scope: { ownerId, storyId: null }, fields: empty, serverSavedAt: null };
  const first = controller(storage, newOptions);
  first.change(fields);
  first.flush();
  const otherNew = controller(storage, newOptions);
  otherNew.change({ ...fields, title: "A different new story" });
  otherNew.flush();
  const reloaded = controller(storage, newOptions);
  const chosen = reloaded.getSnapshot().entries.find((entry) => entry.copy.fields.title === fields.title);
  reloaded.restore(chosen);
  reloaded.flush();
  reloaded.confirmServerSave(savedStory({ id: 101 }));
  assert.equal(listRecovery(storage, { ownerId, storyId: null }).entries.length, 1);
  assert.equal(listRecovery(storage, { ownerId, storyId: null }).entries[0].copy.fields.title, "A different new story");
  reloaded.change({ ...fields, body: "Edited after first account save" });
  reloaded.flush();
  assert.equal(listRecovery(storage, { ownerId, storyId: 101 }).entries.length, 1);
});

test("failed writes preserve the previous recovery and expose unavailable storage", () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "Previously recovered" });
  value.flush();
  storage.rejectWrites = true;
  value.change({ ...fields, body: "Latest unsaved text" });
  value.flush();
  assert.equal(value.getSnapshot().available, false);
  assert.match(value.getSnapshot().error, /unavailable or full/);
  assert.equal(JSON.parse([...storage.values.values()][0]).fields.body, "Previously recovered");
  storage.rejectWrites = false;
  value.flush();
  assert.equal(value.getSnapshot().available, true);
  assert.equal(JSON.parse([...storage.values.values()][0]).fields.body, "Latest unsaved text");
  const blocked = controller(storage, { storage: () => { throw new Error("SecurityError"); } });
  assert.equal(blocked.getSnapshot().available, false);
  assert.equal(blocked.getSnapshot().ready, true);
});

test("a failed account save leaves recovery intact; only confirmed saves clear it", () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "A draft needing recovery" });
  value.flush();
  // A server error does not call confirmServerSave.
  assert.equal(controller(storage).getSnapshot().entries.length, 1);
  value.confirmServerSave(savedStory({ body: "A draft needing recovery" }));
  assert.equal(storage.length, 0);
  assert.equal(value.getSnapshot().savedFields, null);
});

test("storage removal failures do not misreport a successful account save as a failure", () => {
  const storage = new MemoryStorage();
  const value = controller(storage);
  value.change({ ...fields, body: "Saved to account" });
  value.flush();
  storage.rejectRemovals = true;
  value.confirmServerSave(savedStory({ body: "Saved to account" }));
  assert.match(value.getSnapshot().error, /saved to your account/);
  assert.equal(storage.length, 1);
  storage.rejectRemovals = false;
});

test("restoring another copy cannot lose current writing when quota blocks its backup", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  first.change({ ...fields, body: "Older copy" });
  first.flush();
  const current = controller(storage);
  const candidate = current.getSnapshot().entries[0];
  current.change({ ...fields, body: "Current unprotected writing" });
  storage.rejectWrites = true;
  assert.equal(current.restore(candidate), null);
  assert.match(current.getSnapshot().error, /current writing could not be backed up/);
  storage.rejectWrites = false;
  current.flush();
  assert.equal(current.getSnapshot().savedFields, JSON.stringify({ ...fields, body: "Current unprotected writing" }));
});

test("another tab discarding a live copy cannot leave a false saved-on-browser status", () => {
  const storage = new MemoryStorage();
  const first = controller(storage);
  first.change({ ...fields, body: "Still open here" });
  first.flush();
  const other = controller(storage);
  other.discard(other.getSnapshot().entries[0]);
  first.refresh();
  assert.equal(first.getSnapshot().savedFields, null);
  first.flush();
  assert.equal(first.getSnapshot().savedFields, JSON.stringify({ ...fields, body: "Still open here" }));
  assert.equal(storage.length, 1);
});
