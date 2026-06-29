"use client";

import { useActionState } from "react";

import { createGiosContextRow, updateGiosContextRow } from "@/lib/admin/gios_context/actions";
import type { GiosContextRow } from "@/lib/admin/gios_context/types";
import { Button } from "@/components/ui/button";

type GiosContextFormProps =
  | { mode: "create"; row?: never }
  | { mode: "edit"; row: GiosContextRow };

export function GiosContextForm({ mode, row }: GiosContextFormProps) {
  const action = mode === "create" ? createGiosContextRow : updateGiosContextRow;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-3">
      {mode === "edit" ? <input name="id" type="hidden" value={row.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Role</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue={row?.role ?? "user"}
            name="role"
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Model</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue={row?.model ?? ""}
            name="model"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Session ID</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue={row?.session_id ?? ""}
            name="session_id"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Message ID</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue={row?.message_id ?? ""}
            name="message_id"
            type="number"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Source</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.source ?? ""}
          name="source"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Content</span>
        <textarea
          className="min-h-28 rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.content ?? ""}
          name="content"
          required
        />
      </label>

      <ActionStatus state={state} />

      <Button className="w-fit" disabled={pending} size="sm" type="submit">
        {pending ? "Saving..." : mode === "create" ? "Create" : "Update"}
      </Button>
    </form>
  );
}

function ActionStatus({ state }: { state: Awaited<ReturnType<typeof createGiosContextRow>> | null }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

