"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/admin/crud/action-result";
import { optionalText, recordId, unknownError, zodError } from "@/lib/admin/crud/form";
import { documentInputSchema, type DocumentRow } from "@/lib/admin/documents/types";
import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const ROUTE = "/admin/documents";
const SELECT_COLUMNS = "id, created_at, updated_at, title, content, source, url";

export async function createDocumentRow(
  _state: AdminActionResult<DocumentRow> | null,
  formData: FormData,
): Promise<AdminActionResult<DocumentRow>> {
  try {
    await requireGioAdmin();
    const parsed = documentInputSchema.safeParse(readDocumentInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .insert(parsed.data)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Document create affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as DocumentRow, message: `Created document #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not create document.") };
  }
}

export async function updateDocumentRow(
  _state: AdminActionResult<DocumentRow> | null,
  formData: FormData,
): Promise<AdminActionResult<DocumentRow>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid document id is required." };
    }

    const parsed = documentInputSchema.safeParse(readDocumentInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Document update affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as DocumentRow, message: `Updated document #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not update document.") };
  }
}

export async function deleteDocumentRow(
  _state: AdminActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<AdminActionResult<{ id: number }>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid document id is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("documents").delete().eq("id", id).select("id").single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Document delete affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as { id: number }, message: `Deleted document #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not delete document.") };
  }
}

function readDocumentInput(formData: FormData) {
  return {
    title: optionalText(formData, "title"),
    content: optionalText(formData, "content"),
    source: optionalText(formData, "source"),
    url: optionalText(formData, "url"),
  };
}

