"use client";

import { useActionState } from "react";

import { createTodoRow, updateTodoRow } from "@/lib/admin/todos/actions";
import type { TodoRow } from "@/lib/admin/todos/types";
import { Button } from "@/components/ui/button";

type TodoFormProps =
  | { mode: "create"; row?: never }
  | { mode: "edit"; row: TodoRow };

export function TodoForm({ mode, row }: TodoFormProps) {
  const action = mode === "create" ? createTodoRow : updateTodoRow;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-3">
      {mode === "edit" ? <input name="id" type="hidden" value={row.id} /> : null}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.description ?? ""}
          name="description"
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Position</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.position ?? 0}
          name="position"
          type="number"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={row?.is_completed === true} name="is_completed" type="checkbox" />
        Completed
      </label>

      <ActionStatus state={state} />

      <Button className="w-fit" disabled={pending} size="sm" type="submit">
        {pending ? "Saving..." : mode === "create" ? "Create" : "Update"}
      </Button>
    </form>
  );
}

function ActionStatus({ state }: { state: Awaited<ReturnType<typeof createTodoRow>> | null }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

