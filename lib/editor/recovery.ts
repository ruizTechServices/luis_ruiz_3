import type { EditorStory, StoryInput } from "./types";

export type WritingFields = Pick<StoryInput, "title" | "summary" | "body" | "tags" | "references">;
export type RecoveryScope = { ownerId: string; storyId: number | null };
type RecoveryStorage = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;

export const RECOVERY_VERSION = 1;
export const RECOVERY_DELAY_MS = 700;
export const MAX_RECOVERY_LENGTH = 700_000;
const MAX_VISIBLE_COPIES = 20;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const FIELD_LIMITS = { title: 240, summary: 500, body: 100_000, tags: 500, references: 10_000 } as const;

export type RecoveryCopy = {
  version: typeof RECOVERY_VERSION;
  ownerId: string;
  storyId: number | null;
  writerId: string;
  revisionId: string;
  serverSavedAt: string | null;
  savedAt: string;
  fields: WritingFields;
};

export type RecoveryEntry = { key: string; raw: string; copy: RecoveryCopy };

export function writingFields(story: EditorStory | null): WritingFields {
  return { title: story?.title ?? "", summary: story?.summary ?? "", body: story?.body ?? "", tags: story?.tags ?? "", references: story?.references ?? "" };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

export function recoveryPrefix(scope: RecoveryScope): string {
  if (!UUID.test(scope.ownerId) || (scope.storyId !== null && (!Number.isSafeInteger(scope.storyId) || scope.storyId < 1))) throw new Error("Invalid recovery scope");
  return `luis-ruiz:story-recovery:v1:${scope.ownerId}:${scope.storyId ?? "new"}:`;
}

export function recoveryKey(copy: RecoveryCopy): string {
  return `${recoveryPrefix(copy)}${copy.writerId}:${copy.revisionId}`;
}

export function parseRecovery(raw: string | null, scope: RecoveryScope): RecoveryCopy | null {
  if (!raw || raw.length > MAX_RECOVERY_LENGTH) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || Object.keys(value).length !== 8 || value.version !== RECOVERY_VERSION || value.ownerId !== scope.ownerId || value.storyId !== scope.storyId) return null;
    if (typeof value.writerId !== "string" || !UUID.test(value.writerId) || typeof value.revisionId !== "string" || !UUID.test(value.revisionId)) return null;
    if (!isDate(value.savedAt) || (value.serverSavedAt !== null && !isDate(value.serverSavedAt)) || !isObject(value.fields)) return null;
    if ((scope.storyId !== null && value.serverSavedAt === null) || (scope.storyId === null && value.serverSavedAt !== null)) return null;
    if (Object.keys(value.fields).length !== Object.keys(FIELD_LIMITS).length) return null;
    const fields = {} as WritingFields;
    for (const field of Object.keys(FIELD_LIMITS) as (keyof WritingFields)[]) {
      const text = value.fields[field];
      if (typeof text !== "string" || text.length > FIELD_LIMITS[field]) return null;
      fields[field] = text;
    }
    return { version: RECOVERY_VERSION, ownerId: scope.ownerId, storyId: scope.storyId, writerId: value.writerId, revisionId: value.revisionId, serverSavedAt: value.serverSavedAt as string | null, savedAt: value.savedAt, fields };
  } catch { return null; }
}

export function listRecovery(storage: RecoveryStorage, scope: RecoveryScope, writerId?: string): { entries: RecoveryEntry[]; more: boolean } {
  const prefix = recoveryPrefix(scope);
  const entries: RecoveryEntry[] = [];
  // A corrupted origin store must not turn opening the editor into unbounded work.
  if (storage.length > 10_000) throw new Error("Browser storage has too many entries");
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const raw = storage.getItem(key);
    const copy = parseRecovery(raw, scope);
    if (copy && raw && copy.writerId !== writerId && recoveryKey(copy) === key) entries.push({ key, raw, copy });
  }
  entries.sort((first, second) => second.copy.savedAt.localeCompare(first.copy.savedAt));
  return { entries: entries.slice(0, MAX_VISIBLE_COPIES), more: entries.length > MAX_VISIBLE_COPIES };
}

/** Revisions are immutable. Removing this exact key cannot remove a newer revision in another tab. */
export function removeRecovery(storage: RecoveryStorage, entry: RecoveryEntry): boolean {
  if (storage.getItem(entry.key) !== entry.raw) return false;
  storage.removeItem(entry.key);
  return true;
}

export function recoveryConflicts(copy: RecoveryCopy, serverSavedAt: string | null): boolean {
  return copy.serverSavedAt !== serverSavedAt;
}

export type RecoverySnapshot = {
  ready: boolean;
  available: boolean;
  entries: RecoveryEntry[];
  more: boolean;
  savedFields: string | null;
  savedAt: string | null;
  error: string | null;
};

const INITIAL_SNAPSHOT: RecoverySnapshot = { ready: false, available: false, entries: [], more: false, savedFields: null, savedAt: null, error: null };

/** Each mounted editor owns unique revision keys; it never writes into a recovered copy's key. */
export class StoryRecovery {
  private scope: RecoveryScope;
  private serverSavedAt: string | null;
  private serverFields: string;
  private fields: WritingFields;
  private writerId: string | null = null;
  private current: RecoveryEntry | null = null;
  private restored: RecoveryEntry | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private snapshot = INITIAL_SNAPSHOT;

  constructor(private options: {
    scope: RecoveryScope;
    fields: WritingFields;
    serverSavedAt: string | null;
    storage: () => RecoveryStorage;
    randomId: () => string;
    now?: () => Date;
  }) {
    this.scope = options.scope;
    this.serverSavedAt = options.serverSavedAt;
    this.fields = options.fields;
    this.serverFields = JSON.stringify(options.fields);
  }

  getSnapshot = (): RecoverySnapshot => this.snapshot;
  getServerSnapshot = (): RecoverySnapshot => INITIAL_SNAPSHOT;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private emit(changes: Partial<RecoverySnapshot>) {
    this.snapshot = { ...this.snapshot, ...changes };
    for (const listener of this.listeners) listener();
  }

  private unavailable() {
    this.emit({ ready: true, available: false, error: "Browser recovery is unavailable or full. Keep this tab open and save to your account, or copy your writing before leaving." });
  }

  initialize = () => {
    try {
      this.writerId ??= this.options.randomId();
      const firstRead = !this.snapshot.ready;
      if (this.refresh() && firstRead) this.emit({ available: true });
    } catch { this.unavailable(); }
  };

  refresh = () => {
    try {
      const storage = this.options.storage();
      if (this.current && storage.getItem(this.current.key) !== this.current.raw) {
        this.current = null;
        this.emit({ savedFields: null, savedAt: null });
        this.change(this.fields);
      }
      const { entries, more } = listRecovery(storage, this.scope);
      this.emit({ ready: true, entries: entries.filter((entry) => entry.key !== this.restored?.key && entry.key !== this.current?.key), more });
      return true;
    } catch { this.unavailable(); return false; }
  };

  change = (fields: WritingFields) => {
    this.fields = { ...fields };
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.flush, RECOVERY_DELAY_MS);
  };

  flush = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const serialized = JSON.stringify(this.fields);
    if (serialized === this.serverFields) {
      try {
        if (this.current) removeRecovery(this.options.storage(), this.current);
        this.current = null;
        this.emit({ savedFields: null, savedAt: null });
      } catch { this.unavailable(); }
      return;
    }
    try {
      const storage = this.options.storage();
      if (this.current && this.snapshot.available && serialized === this.snapshot.savedFields && storage.getItem(this.current.key) === this.current.raw) return;
      this.writerId ??= this.options.randomId();
      const copy: RecoveryCopy = { version: RECOVERY_VERSION, ...this.scope, writerId: this.writerId, revisionId: this.options.randomId(), serverSavedAt: this.serverSavedAt, savedAt: (this.options.now?.() ?? new Date()).toISOString(), fields: { ...this.fields } };
      const raw = JSON.stringify(copy);
      if (!parseRecovery(raw, this.scope)) throw new Error("Recovery data is too large or invalid");
      const key = recoveryKey(copy);
      // Write first: quota/storage failures must preserve the previous good copy.
      if (storage.getItem(key) !== null) throw new Error("Recovery revision already exists");
      storage.setItem(key, raw);
      const previous = this.current;
      this.current = { key, raw, copy };
      if (previous) removeRecovery(storage, previous);
      this.emit({ ready: true, available: true, savedFields: serialized, savedAt: copy.savedAt, error: null });
    } catch { this.unavailable(); }
  };

  restore = (entry: RecoveryEntry): WritingFields | null => {
    try {
      const storage = this.options.storage();
      const parsed = parseRecovery(entry.raw, this.scope);
      if (!parsed || recoveryKey(parsed) !== entry.key || storage.getItem(entry.key) !== entry.raw) {
        this.refresh();
        this.emit({ error: "That browser copy changed or was removed in another tab. Choose a current copy below." });
        return null;
      }
      this.flush();
      if (JSON.stringify(this.fields) !== this.serverFields && (!this.snapshot.available || this.snapshot.savedFields !== JSON.stringify(this.fields))) {
        this.emit({ error: "Your current writing could not be backed up. Save or copy it before restoring another browser copy." });
        return null;
      }
      // Keep current unsaved writing as a separate copy when the owner explicitly switches versions.
      this.current = null;
      this.restored = entry;
      this.change(parsed.fields);
      this.refresh();
      this.emit({ error: null });
      return { ...parsed.fields };
    } catch { this.unavailable(); return null; }
  };

  discard = (entry: RecoveryEntry) => {
    try {
      const parsed = parseRecovery(entry.raw, this.scope);
      if (!parsed || recoveryKey(parsed) !== entry.key) return;
      removeRecovery(this.options.storage(), entry);
      this.refresh();
      this.emit({ error: null });
    } catch { this.unavailable(); }
  };

  /** Call only after the server confirms this submission; failed saves leave every recovery intact. */
  confirmServerSave = (story: EditorStory) => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    let cleared = true;
    try {
      const storage = this.options.storage();
      if (this.current) removeRecovery(storage, this.current);
      if (this.restored) removeRecovery(storage, this.restored);
    } catch { cleared = false; }
    this.current = null;
    this.restored = null;
    this.scope = { ...this.scope, storyId: story.id };
    this.serverSavedAt = story.updated_at;
    this.fields = writingFields(story);
    this.serverFields = JSON.stringify(this.fields);
    this.emit({ savedFields: null, savedAt: null, error: cleared ? null : "Your story is saved to your account, but this browser could not remove its recovery copy." });
    this.refresh();
  };

  stop = () => { this.flush(); };
}
