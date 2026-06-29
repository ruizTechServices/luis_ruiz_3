"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/admin/crud/action-result";
import { optionalText, recordId, unknownError, zodError } from "@/lib/admin/crud/form";
import { journalInputSchema, type JournalRow } from "@/lib/admin/journal/types";
import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const ROUTE = "/admin/journal";
const SELECT_COLUMNS = "id, created_at, updated_at, title, content, tags";

export async function createJournalRow(
  _state: AdminActionResult<JournalRow> | null,
  formData: FormData,
): Promise<AdminActionResult<JournalRow>> {
  try {
    await requireGioAdmin();
    const parsed = journalInputSchema.safeParse(readJournalInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("journal")
      .insert(parsed.data)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Journal create affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as JournalRow, message: `Created journal row #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not create journal row.") };
  }
}

export async function updateJournalRow(
  _state: AdminActionResult<JournalRow> | null,
  formData: FormData,
): Promise<AdminActionResult<JournalRow>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid journal id is required." };
    }

    const parsed = journalInputSchema.safeParse(readJournalInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("journal")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Journal update affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as JournalRow, message: `Updated journal row #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not update journal row.") };
  }
}

export async function deleteJournalRow(
  _state: AdminActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<AdminActionResult<{ id: number }>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid journal id is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("journal").delete().eq("id", id).select("id").single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Journal delete affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as { id: number }, message: `Deleted journal row #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not delete journal row.") };
  }
}

function readJournalInput(formData: FormData) {
  return {
    title: optionalText(formData, "title"),
    content: optionalText(formData, "content"),
    tags: optionalText(formData, "tags"),
  };
}

