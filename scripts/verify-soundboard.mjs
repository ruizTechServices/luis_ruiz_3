import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(path.join(tmpdir(), "luis-ruiz-soundboard-"));
symlinkSync(path.join(root, "node_modules"), path.join(temporary, "node_modules"), "dir");
for (const name of ["catalog", "preferences", "audio-validation", "upload-request"]) {
  const source = readFileSync(path.join(root, "lib/soundboard", `${name}.ts`), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  writeFileSync(path.join(temporary, `${name}.js`), compiled.outputText);
}
const require = createRequire(import.meta.url);
const { SOUND_CLIPS } = require(path.join(temporary, "catalog.js"));
const helpers = require(path.join(temporary, "preferences.js"));
const audio = require(path.join(temporary, "audio-validation.js"));
const requests = require(path.join(temporary, "upload-request.js"));
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

test("original audio remains byte-for-byte identical to the recovery ledger", () => {
  const ledger = readFileSync(path.join(root, "docs/soundboard-provenance.md"), "utf8");
  for (const sound of SOUND_CLIPS) {
    const line = ledger.split("\n").find((line) => line.includes(`\`${sound.src}\``) && line.includes(" | "));
    assert.ok(line, `Missing ledger entry: ${sound.id}`);
    const expected = line.match(/`([a-f0-9]{64})`/)[1];
    assert.equal(createHash("sha256").update(readFileSync(path.join(root, "public", sound.src))).digest("hex"), expected);
  }
});

test("new clip preferences survive reload and archive without accepting arbitrary IDs", () => {
  const id = "sound-9af3f2ca-b693-4836-8e1d-05a7fc6df36a";
  assert.deepEqual(helpers.parseSoundPreferences(JSON.stringify({ favorites: [id, "arbitrary", id], recent: [id] })).favorites, [id]);
  assert.deepEqual(helpers.parseSoundPreferences(JSON.stringify({ recent: [id] })).recent, [id]);
});

function wav(seconds = 1, withMetadata = false) {
  const size = 8000 * 2 * seconds;
  const file = Buffer.alloc(44 + size + (withMetadata ? 16 : 0));
  file.write("RIFF"); file.writeUInt32LE(file.length - 8, 4); file.write("WAVEfmt ", 8);
  file.writeUInt32LE(16, 16); file.writeUInt16LE(1, 20); file.writeUInt16LE(1, 22); file.writeUInt32LE(8000, 24);
  file.writeUInt32LE(16000, 28); file.writeUInt16LE(2, 32); file.writeUInt16LE(16, 34);
  let offset = 36;
  if (withMetadata) { file.write("LIST", offset); file.writeUInt32LE(8, offset + 4); file.write("private!", offset + 8); offset += 16; }
  file.write("data", offset); file.writeUInt32LE(size, offset + 4);
  return file;
}

test("WAV audio duration is measured from actual samples and metadata removed", () => {
  const result = audio.validateAudio(wav(1, true));
  assert.equal(result.durationSeconds, 1);
  assert.equal(result.extension, "wav");
  assert.equal(result.contentType, "audio/wav");
  assert.equal(result.bytes.length, 16044);
  assert.equal(result.bytes.includes(Buffer.from("private!")), false);
  assert.deepEqual(result.bytes, wav(1));
});

test("WAV rejects truncated chunks, compressed audio, inconsistent rates and duration/size limits", () => {
  const invalids = [wav().subarray(0, 100), wav(61), Buffer.alloc(audio.MAX_AUDIO_BYTES + 1), Buffer.from("not audio at all")];
  for (const offset of [20, 22, 28, 32]) { const bytes = wav(); bytes.writeUInt16LE(0, offset); invalids.push(bytes); }
  const chunkOverflow = wav(); chunkOverflow.writeUInt32LE(0xffffffff, 40); invalids.push(chunkOverflow);
  for (const bytes of invalids) assert.throws(() => audio.validateAudio(bytes), audio.AudioInputError);
});

function mp3Frame(bitrateIndex = 9) {
  const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const bytes = Buffer.alloc(Math.floor(144 * bitrates[bitrateIndex] * 1000 / 44100));
  bytes.writeUInt32BE((0xfffb0000 | bitrateIndex << 12) >>> 0);
  return bytes;
}

test("MP3 parses every frame for VBR duration and removes ID3 tags", () => {
  const frames = Buffer.concat([mp3Frame(9), mp3Frame(10), mp3Frame(7), mp3Frame(14)]);
  const id3 = Buffer.from([73, 68, 51, 4, 0, 0, 0, 0, 0, 8, 112, 114, 105, 118, 97, 116, 101, 33]);
  const tag = Buffer.alloc(128); tag.write("TAG");
  const result = audio.validateAudio(Buffer.concat([id3, frames, tag]));
  assert.equal(result.extension, "mp3");
  assert.ok(Math.abs(result.durationSeconds - 4 * 1152 / 44100) < 1e-10);
  assert.deepEqual(result.bytes, frames);
});

test("MP3 refuses malformed, truncated, unsupported, overlong or appended payloads", () => {
  const good = Buffer.concat([mp3Frame(), mp3Frame(), mp3Frame()]);
  const invalidHeader = Buffer.from(good); invalidHeader[2] = 0;
  const invalidTag = Buffer.from([73, 68, 51, 4, 0, 0, 127, 127, 127, 127]);
  for (const bytes of [good.subarray(0, -1), invalidHeader, invalidTag, Buffer.concat([good, Buffer.from("<script>bad</script>")]), Buffer.concat(Array.from({ length: 2300 }, () => mp3Frame()))]) assert.throws(() => audio.validateAudio(bytes), audio.AudioInputError);
});

test("a real original MP3 validates without relying on its filename or browser MIME", () => {
  const source = readFileSync(path.join(root, "public/sounds/vine-boom.mp3"));
  const result = audio.validateAudio(source);
  assert.equal(result.extension, "mp3");
  assert.ok(Math.abs(result.durationSeconds - SOUND_CLIPS[0].durationSeconds) < 0.06);
});

test("multipart audio upload enforces actual body size even without Content-Length", async () => {
  const form = new FormData(); form.set("file", new File([wav()], "test.wav", { type: "audio/wav" })); form.set("label", "Test");
  const parsed = await requests.readAudioUpload(new Request("https://example.com/api/soundboard", { method: "POST", body: form }));
  assert.equal(parsed.get("label"), "Test"); assert.equal(parsed.get("file").size, wav().length);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(5000)); controller.close(); } });
  await assert.rejects(() => requests.readBoundedBody(new Request("https://example.com", { method: "POST", body: stream, duplex: "half" }), 4096), audio.AudioInputError);
});

test("MP3 decoder accepts real audio and leaves the encoded samples unchanged", async () => {
  for (const sound of SOUND_CLIPS.filter((clip) => clip.id !== "gigachad")) {
    const structured = audio.validateAudio(readFileSync(path.join(root, "public", sound.src)));
    const decoded = await audio.verifyAudioPlayback(structured);
    assert.deepEqual(decoded.bytes, structured.bytes, sound.id);
    assert.ok(decoded.durationSeconds >= 0.05 && decoded.durationSeconds <= 60, sound.id);
  }
});

test("MP3 decoder rejects damaged frame bodies that pass structural checks", async () => {
  const damagedFrame = mp3Frame(); damagedFrame.fill(255, 4);
  const structured = audio.validateAudio(Buffer.concat(Array.from({ length: 50 }, () => damagedFrame)));
  assert.ok(structured.durationSeconds > 1);
  await assert.rejects(() => audio.verifyAudioPlayback(structured), audio.AudioInputError);
});
