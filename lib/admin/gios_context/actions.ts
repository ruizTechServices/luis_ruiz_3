"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/admin/crud/action-result";
import {
  optionalInteger,
  optionalText,
  recordId,
  requiredText,
  unknownError,
  zodError,
} from "@/lib/admin/crud/form";
import { giosContextInputSchema, type GiosContextRow } from "@/lib/admin/gios_context/types";
import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const ROUTE = "/admin/gios-context";
const SELECT_COLUMNS = "id, created_at, session_id, message_id, role, model, source, content, user_id";

export async function createGiosContextRow(
  _state: AdminActionResult<GiosContextRow> | null,
  formData: FormData,
): Promise<AdminActionResult<GiosContextRow>> {
  try {
    const user = await requireGioAdmin();
    const parsed = giosContextInputSchema.safeParse(readGiosContextInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gios_context")
      .insert({ ...parsed.data, user_id: user.id })
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Gio context create affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as GiosContextRow, message: `Created Gio context #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not create Gio context row.") };
  }
}

export async function updateGiosContextRow(
  _state: AdminActionResult<GiosContextRow> | null,
  formData: FormData,
): Promise<AdminActionResult<GiosContextRow>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid Gio context id is required." };
    }

    const parsed = giosContextInputSchema.safeParse(readGiosContextInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gios_context")
      .update(parsed.data)
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Gio context update affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as GiosContextRow, message: `Updated Gio context #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not update Gio context row.") };
  }
}

export async function deleteGiosContextRow(
  _state: AdminActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<AdminActionResult<{ id: number }>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid Gio context id is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gios_context")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Gio context delete affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as { id: number }, message: `Deleted Gio context #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not delete Gio context row.") };
  }
}

function readGiosContextInput(formData: FormData) {
  return {
    session_id: optionalInteger(formData, "session_id"),
    message_id: optionalInteger(formData, "message_id"),
    role: requiredText(formData, "role"),
    model: optionalText(formData, "model"),
    source: optionalText(formData, "source"),
    content: requiredText(formData, "content"),
  };
}

