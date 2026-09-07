"use client";

import { recoveryConflicts, type RecoveryEntry } from "@/lib/editor/recovery";

export function RecoveryCopies({ entries, more, serverSavedAt, disabled, onRestore, onDiscard }: {
  entries: RecoveryEntry[];
  more: boolean;
  serverSavedAt: string | null;
  disabled: boolean;
  onRestore: (entry: RecoveryEntry) => void;
  onDiscard: (entry: RecoveryEntry) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="recovery-title" className="mb-8 rounded-xl border border-primary/25 bg-primary/5 p-5">
      <h2 id="recovery-title" className="font-medium">Writing recovered from this browser</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a copy to review, or keep writing below. Restoring changes the editor only; saving and publishing are still your choice. Copies from other tabs stay separate.</p>
      <div className="mt-4 max-h-[30rem] space-y-4 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div key={entry.key} className="rounded-lg border border-border bg-background p-4">
            <p className="break-words text-sm font-medium">{entry.copy.fields.title || "Untitled story"}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Saved on this browser {new Date(entry.copy.savedAt).toLocaleString()}</p>
            {recoveryConflicts(entry.copy, serverSavedAt) && <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">The account version changed after this copy was started. Review both versions before saving recovered writing.</p>}
            <details className="mt-2 text-sm">
              <summary className="min-h-11 cursor-pointer py-3 text-muted-foreground">Read this browser copy</summary>
              <div className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-sm leading-6">
                {entry.copy.fields.summary && <p className="mb-3">{entry.copy.fields.summary}</p>}
                <p>{entry.copy.fields.body || "No body text yet."}</p>
                {entry.copy.fields.tags && <p className="mt-3">Topics: {entry.copy.fields.tags}</p>}
                {entry.copy.fields.references && <p className="mt-3">Sources: {entry.copy.fields.references}</p>}
              </div>
            </details>
            <div className="mt-2 flex flex-wrap gap-3">
              <button type="button" disabled={disabled} onClick={() => onRestore(entry)} className="min-h-11 rounded-full bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">Restore for review</button>
              <button type="button" disabled={disabled} onClick={() => onDiscard(entry)} className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-50">Discard this copy</button>
            </div>
          </div>
        ))}
      </div>
      {more && <p className="mt-3 text-xs text-muted-foreground">Showing the 20 newest copies. Discard individual copies to see older ones.</p>}
    </section>
  );
}
