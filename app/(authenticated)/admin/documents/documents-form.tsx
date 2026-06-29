"use client";

import { useActionState } from "react";

import { createDocumentRow, updateDocumentRow } from "@/lib/admin/documents/actions";
import type { DocumentRow } from "@/lib/admin/documents/types";
import { Button } from "@/components/ui/button";

type DocumentFormProps =
  | { mode: "create"; row?: never }
  | { mode: "edit"; row: DocumentRow };

export function DocumentForm({ mode, row }: DocumentFormProps) {
  const action = mode === "create" ? createDocumentRow : updateDocumentRow;
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
        <span className="font-medium">Source</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.source ?? ""}
          name="source"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">URL</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue={row?.url ?? ""}
          name="url"
          type="url"
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

function ActionStatus({ state }: { state: Awaited<ReturnType<typeof createDocumentRow>> | null }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

