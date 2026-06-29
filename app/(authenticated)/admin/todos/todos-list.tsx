"use client";

import { useActionState, useState } from "react";

import { TodoForm } from "@/app/(authenticated)/admin/todos/todos-form";
import { deleteTodoRow } from "@/lib/admin/todos/actions";
import type { TodoRow } from "@/lib/admin/todos/types";
import { formatDate } from "@/lib/data/format";
import { Button } from "@/components/ui/button";

export function TodoList({ rows }: { rows: TodoRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No todo rows visible.</p>;
  }

  return (
    <section className="grid gap-4">
      {rows.map((row) => (
        <TodoRowCard key={row.id} row={row} />
      ))}
    </section>
  );
}

function TodoRowCard({ row }: { row: TodoRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(deleteTodoRow, null);

  return (
    <article className="grid gap-4 rounded-md border border-border p-4">
      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold tracking-normal">#{row.id} {row.description}</h2>
          <span className="text-xs text-muted-foreground">
            {row.created_at ? formatDate(row.created_at) : "No date"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Position {row.position ?? 0} | {row.is_completed ? "Completed" : "Open"}
        </p>
        {row.updated_at ? (
          <p className="text-xs text-muted-foreground">Updated {formatDate(row.updated_at)}</p>
        ) : null}
      </div>

      {isEditing ? <TodoForm mode="edit" row={row} /> : null}

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

