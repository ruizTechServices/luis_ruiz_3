"use client";

import { useActionState, useState } from "react";

import { JournalForm } from "@/app/(authenticated)/admin/journal/journal-form";
import { deleteJournalRow } from "@/lib/admin/journal/actions";
import type { JournalRow } from "@/lib/admin/journal/types";
import { formatDate } from "@/lib/data/format";
import { Button } from "@/components/ui/button";

export function JournalList({ rows }: { rows: JournalRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No journal rows visible.</p>;
  }

  return (
    <section className="grid gap-4">
      {rows.map((row) => (
        <JournalRowCard key={row.id} row={row} />
      ))}
    </section>
  );
}

function JournalRowCard({ row }: { row: JournalRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(deleteJournalRow, null);

  return (
    <article className="grid gap-4 rounded-md border border-border p-4">
      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold tracking-normal">#{row.id} {row.title ?? "Untitled"}</h2>
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words">{row.content ?? "Empty"}</p>
        <p className="text-xs text-muted-foreground">Tags: {row.tags ?? "None"}</p>
        {row.updated_at ? (
          <p className="text-xs text-muted-foreground">Updated {formatDate(row.updated_at)}</p>
        ) : null}
      </div>

      {isEditing ? <JournalForm mode="edit" row={row} /> : null}

      {state ? (
        <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>
          {state.ok ? state.message : state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="button" variant="outline" onClick={() => setIsEditing((value) => !value)}>
          {isEditing ? "Close" : "Edit"}
        </Button>
        <form action={formAction}>
          <input name="id" type="hidden" value={row.id} />
          <Button disabled={pending} size="sm" type="submit" variant="destructive">
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </form>
      </div>
    </article>
  );
}

