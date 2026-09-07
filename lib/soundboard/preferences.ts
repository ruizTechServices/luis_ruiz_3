import { SOUND_CLIPS } from "./catalog";

export const SOUNDBOARD_STORAGE_KEY = "luis-ruiz:soundboard:v1";
const CHANGE_EVENT = "luis-ruiz:soundboard-preferences";
const knownIds = new Set(SOUND_CLIPS.map((sound) => sound.id));
let volatileSnapshot: string | undefined;

export interface SoundPreferences {
  favorites: string[];
  recent: string[];
  volume: number;
  muted: boolean;
  keyboardEnabled: boolean;
}

export function parseSoundPreferences(raw: string | null): SoundPreferences {
  const defaults: SoundPreferences = { favorites: [], recent: [], volume: 0.72, muted: false, keyboardEnabled: true };
  if (!raw || raw.length > 20_000) return defaults;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
    const data = value as Record<string, unknown>;
    const validIds = (items: unknown, limit: number) => Array.isArray(items)
      ? [...new Set(items.filter((id): id is string => typeof id === "string" && knownIds.has(id)))].slice(0, limit)
      : [];
    return {
      favorites: validIds(data.favorites, SOUND_CLIPS.length),
      recent: validIds(data.recent, 6),
      volume: typeof data.volume === "number" && Number.isFinite(data.volume) ? Math.min(1, Math.max(0, data.volume)) : 0.72,
      muted: data.muted === true,
      keyboardEnabled: typeof data.keyboardEnabled === "boolean" ? data.keyboardEnabled : true,
    };
  } catch { return defaults; }
}

export function readSoundPreferencesSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  if (volatileSnapshot !== undefined) return volatileSnapshot;
  try { return window.localStorage.getItem(SOUNDBOARD_STORAGE_KEY); }
  catch { return null; }
}

export function serverSoundPreferencesSnapshot(): null { return null; }

export function updateSoundPreferences(update: (current: SoundPreferences) => SoundPreferences): boolean {
  const next = JSON.stringify(update(parseSoundPreferences(readSoundPreferencesSnapshot())));
  let persisted = true;
  try {
    window.localStorage.setItem(SOUNDBOARD_STORAGE_KEY, next);
    volatileSnapshot = undefined;
  } catch {
    volatileSnapshot = next;
    persisted = false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return persisted;
}

export function subscribeSoundPreferences(notify: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key !== SOUNDBOARD_STORAGE_KEY && event.key !== null) return;
    volatileSnapshot = undefined;
    notify();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

export function dailySoundIndex(utcDate: string, count: number): number {
  if (count < 1) return 0;
  const day = Date.parse(`${utcDate}T00:00:00.000Z`);
  return Number.isFinite(day) ? ((Math.floor(day / 86_400_000) % count) + count) % count : 0;
}

export function randomSoundIndex(ids: readonly string[], currentId: string | null, random = Math.random()): number {
  const candidates = ids.map((id, index) => ({ id, index })).filter(({ id }) => id !== currentId);
  if (!candidates.length) return 0;
  const boundedRandom = Number.isFinite(random) ? Math.min(0.999999999999, Math.max(0, random)) : 0;
  return candidates[Math.floor(boundedRandom * candidates.length)].index;
}

export function safeSeek(seconds: number, duration: number): number | null {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.max(0, Math.min(seconds, duration));
}

export function formatSoundTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function shouldIgnoreSoundShortcut(event: Pick<KeyboardEvent, "key" | "defaultPrevented" | "repeat" | "isComposing" | "ctrlKey" | "altKey" | "metaKey">, editing: boolean, interactive: boolean): boolean {
  return event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || editing || ((event.key === " " || event.key === "Enter") && interactive);
}

export function ignoreSoundShortcut(event: KeyboardEvent): boolean {
  const target = event.target;
  const editing = target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="combobox"]'));
  const interactive = target instanceof Element && Boolean(target.closest('button, a[href], summary, [role="button"], [role="link"], [role="checkbox"], [role="switch"]'));
  return shouldIgnoreSoundShortcut(event, editing, interactive);
}

export function readUtcDate(): string { return new Date().toISOString().slice(0, 10); }
export function serverUtcDate(): string { return ""; }
export function subscribeUtcDate(notify: () => void): () => void {
  const interval = window.setInterval(notify, 60_000);
  document.addEventListener("visibilitychange", notify);
  return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", notify); };
}
