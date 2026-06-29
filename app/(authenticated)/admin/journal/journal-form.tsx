"use client";

import { useActionState } from "react";

import { createJournalRow, updateJournalRow } from "@/lib/admin/journal/actions";
import type { JournalRow } from "@/lib/admin/journal/types";
import { Button } from "@/components/ui/button";

type JournalFormProps =
  | { mode: "create"; row?: never }
  | { mode: "edit"; row: JournalRow };

export function JournalForm({ mode, row }: JournalFormProps) {
  const action = mode === "create" ? createJournalRow : updateJournalRow;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-3">
      {mode === "edit" ? <input name="id" type="hidden" value={row.id} /> : null}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.title ?? ""}
          name="title"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Tags</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.tags ?? ""}
          name="tags"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Content</span>
        <textarea
          className="min-h-28 rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.content ?? ""}
          name="content"
        />
      </label>

      <ActionStatus state={state} />

      <Button className="w-fit" disabled={pending} size="sm" type="submit">
        {pending ? "Saving..." : mode === "create" ? "Create" : "Update"}
      </Button>
    </form>
  );
}

function ActionStatus({ state }: { state: Awaited<ReturnType<typeof createJournalRow>> | null }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

