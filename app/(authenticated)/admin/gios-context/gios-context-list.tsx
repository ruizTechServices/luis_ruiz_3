"use client";

import { useActionState, useState } from "react";

import { GiosContextForm } from "@/app/(authenticated)/admin/gios-context/gios-context-form";
import { deleteGiosContextRow } from "@/lib/admin/gios_context/actions";
import type { GiosContextRow } from "@/lib/admin/gios_context/types";
import { formatDate } from "@/lib/data/format";
import { Button } from "@/components/ui/button";

export function GiosContextList({ rows }: { rows: GiosContextRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No Gio context rows visible.</p>;
  }

  return (
    <section className="grid gap-4">
      {rows.map((row) => (
        <GiosContextRowCard key={row.id} row={row} />
      ))}
    </section>
  );
}

function GiosContextRowCard({ row }: { row: GiosContextRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(deleteGiosContextRow, null);

  return (
    <article className="grid gap-4 rounded-md border border-border p-4">
      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold tracking-normal">#{row.id} {row.role}</h2>
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Session {row.session_id ?? "none"} | Message {row.message_id ?? "none"} | Model {row.model ?? "none"}
        </p>
        <p className="text-xs text-muted-foreground">Source: {row.source ?? "None"}</p>
        <p className="whitespace-pre-wrap break-words">{row.content}</p>
        <p className="break-all text-xs text-muted-foreground">User ID: {row.user_id ?? "None"}</p>
      </div>

      {isEditing ? <GiosContextForm mode="edit" row={row} /> : null}

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

