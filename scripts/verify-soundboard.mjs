import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(path.join(tmpdir(), "luis-ruiz-soundboard-"));
for (const name of ["catalog", "preferences"]) {
  const source = readFileSync(path.join(root, "lib/soundboard", `${name}.ts`), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  writeFileSync(path.join(temporary, `${name}.js`), compiled.outputText);
}
const require = createRequire(import.meta.url);
const { SOUND_CLIPS } = require(path.join(temporary, "catalog.js"));
const helpers = require(path.join(temporary, "preferences.js"));
after(() => rmSync(temporary, { recursive: true, force: true }));

test("all 16 archived sounds have unique IDs/keys and real nonempty local audio", () => {
  assert.equal(SOUND_CLIPS.length, 16);
  assert.equal(new Set(SOUND_CLIPS.map((sound) => sound.id)).size, 16);
  assert.equal(new Set(SOUND_CLIPS.map((sound) => sound.hotkey.toLowerCase())).size, 16);
  assert.deepEqual(SOUND_CLIPS.map((sound) => sound.hotkey.toUpperCase()), [..."123456789QWERTYU"]);
  for (const sound of SOUND_CLIPS) {
    assert.match(sound.id, /^[a-z0-9-]+$/);
    assert.match(sound.src, /^\/sounds\/[^/]+\.mp3$/);
    assert.ok(Number.isFinite(sound.durationSeconds) && sound.durationSeconds > 0);
    const audioPath = path.join(root, "public", sound.src);
    assert.ok(statSync(audioPath).isFile(), `${sound.id}: missing audio file`);
    assert.ok(statSync(audioPath).size > 100, `${sound.id}: audio file is empty or truncated`);
  }
});

test("untrusted browser preferences are bounded and recover from invalid JSON", () => {
  assert.deepEqual(helpers.parseSoundPreferences("invalid"), { favorites: [], recent: [], volume: 0.72, muted: false, keyboardEnabled: true });
  for (const value of ["null", "[]", "42", "x".repeat(20_001)]) assert.equal(helpers.parseSoundPreferences(value).volume, 0.72);
  const parsed = helpers.parseSoundPreferences(JSON.stringify({ favorites: [SOUND_CLIPS[0].id, "unknown", SOUND_CLIPS[0].id, 9], recent: SOUND_CLIPS.map((sound) => sound.id), volume: 200, muted: "true" }));
  assert.deepEqual(parsed.favorites, [SOUND_CLIPS[0].id]);
  assert.equal(parsed.recent.length, 6);
  assert.equal(parsed.volume, 1);
  assert.equal(parsed.muted, false);
  assert.equal(parsed.keyboardEnabled, true);
  assert.equal(helpers.parseSoundPreferences('{"keyboardEnabled":false}').keyboardEnabled, false);
  assert.equal(helpers.parseSoundPreferences('{"keyboardEnabled":"false"}').keyboardEnabled, true);
  assert.equal(helpers.parseSoundPreferences('{"volume":-10}').volume, 0);
});

test("preferences still work when browser storage rejects writes", () => {
  const originalWindow = globalThis.window;
  const values = new Map();
  const browser = new EventTarget();
  let rejectStorage = true;
  browser.localStorage = {
    getItem(key) { if (rejectStorage) throw new Error("Storage unavailable"); return values.get(key) ?? null; },
    setItem(key, value) { if (rejectStorage) throw new Error("Storage unavailable"); values.set(key, value); },
  };
  globalThis.window = browser;
  let changes = 0;
  const unsubscribe = helpers.subscribeSoundPreferences(() => { changes += 1; });
  try {
    assert.equal(helpers.readSoundPreferencesSnapshot(), null);
    assert.equal(helpers.updateSoundPreferences((current) => ({ ...current, favorites: [SOUND_CLIPS[0].id] })), false);
    assert.equal(helpers.updateSoundPreferences((current) => ({ ...current, volume: 0.25 })), false);
    const transient = helpers.parseSoundPreferences(helpers.readSoundPreferencesSnapshot());
    assert.deepEqual(transient.favorites, [SOUND_CLIPS[0].id]);
    assert.equal(transient.volume, 0.25);
    rejectStorage = false;
    assert.equal(helpers.updateSoundPreferences((current) => ({ ...current, muted: true })), true);
    assert.equal(helpers.parseSoundPreferences(values.get(helpers.SOUNDBOARD_STORAGE_KEY)).muted, true);
    assert.equal(changes, 3);
  } finally { unsubscribe(); globalThis.window = originalWindow; }
});

test("daily pick is deterministic by UTC date and rotates through the archive", () => {
  const first = helpers.dailySoundIndex("2026-09-07", 16);
  assert.equal(helpers.dailySoundIndex("2026-09-07", 16), first);
  assert.equal(helpers.dailySoundIndex("2026-09-08", 16), (first + 1) % 16);
  assert.equal(helpers.dailySoundIndex("2026-09-23", 16), first);
  assert.equal(helpers.dailySoundIndex("invalid", 16), 0);
});

test("random selection excludes the selected clip and remains in range", () => {
  const ids = SOUND_CLIPS.map((sound) => sound.id);
  for (const id of ids) for (const random of [0, 0.2, 0.5, 0.999, 1, -1, Number.NaN]) {
    const result = helpers.randomSoundIndex(ids, id, random);
    assert.ok(result >= 0 && result < ids.length);
    assert.notEqual(ids[result], id);
  }
});

test("seek clamps finite positions and refuses unknown/infinite durations", () => {
  assert.equal(helpers.safeSeek(4, 10), 4);
  assert.equal(helpers.safeSeek(-1, 10), 0);
  assert.equal(helpers.safeSeek(20, 10), 10);
  for (const duration of [0, -1, Number.NaN, Infinity]) assert.equal(helpers.safeSeek(1, duration), null);
  assert.equal(helpers.safeSeek(Number.NaN, 10), null);
  assert.equal(helpers.formatSoundTime(Infinity), "0:00");
  assert.equal(helpers.formatSoundTime(61.9), "1:01");
});

test("shortcuts leave typing, native controls, modifier combinations, and repeats alone", () => {
  const event = { key: "1", defaultPrevented: false, repeat: false, isComposing: false, ctrlKey: false, altKey: false, metaKey: false };
  assert.equal(helpers.shouldIgnoreSoundShortcut(event, false, false), false);
  assert.equal(helpers.shouldIgnoreSoundShortcut(event, true, false), true);
  for (const key of [" ", "Enter"]) assert.equal(helpers.shouldIgnoreSoundShortcut({ ...event, key }, false, true), true);
  for (const flag of ["defaultPrevented", "repeat", "isComposing", "ctrlKey", "altKey", "metaKey"]) assert.equal(helpers.shouldIgnoreSoundShortcut({ ...event, [flag]: true }, false, false), true);
  assert.equal(helpers.shouldIgnoreSoundShortcut({ ...event, key: "Escape" }, true, false), true);
});
