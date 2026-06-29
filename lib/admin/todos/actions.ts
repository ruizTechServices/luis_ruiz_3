"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/admin/crud/action-result";
import {
  checkboxValue,
  optionalInteger,
  recordId,
  requiredText,
  unknownError,
  zodError,
} from "@/lib/admin/crud/form";
import { todoInputSchema, type TodoRow } from "@/lib/admin/todos/types";
import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const ROUTE = "/admin/todos";
const SELECT_COLUMNS = "id, description, is_completed, created_at, updated_at, position";

export async function createTodoRow(
  _state: AdminActionResult<TodoRow> | null,
  formData: FormData,
): Promise<AdminActionResult<TodoRow>> {
  try {
    await requireGioAdmin();
    const parsed = todoInputSchema.safeParse(readTodoInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("todos")
      .insert(parsed.data)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Todo create affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as TodoRow, message: `Created todo #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not create todo.") };
  }
}

export async function updateTodoRow(
  _state: AdminActionResult<TodoRow> | null,
  formData: FormData,
): Promise<AdminActionResult<TodoRow>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid todo id is required." };
    }

    const parsed = todoInputSchema.safeParse(readTodoInput(formData));

    if (!parsed.success) {
      return { ok: false, error: zodError(parsed.error) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("todos")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Todo update affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as TodoRow, message: `Updated todo #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not update todo.") };
  }
}

export async function deleteTodoRow(
  _state: AdminActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<AdminActionResult<{ id: number }>> {
  try {
    await requireGioAdmin();
    const id = recordId(formData);

    if (Number.isNaN(id)) {
      return { ok: false, error: "A valid todo id is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("todos").delete().eq("id", id).select("id").single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Todo delete affected 0 rows." };
    }

    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, data: data as { id: number }, message: `Deleted todo #${data.id}.` };
  } catch (error) {
    return { ok: false, error: unknownError(error, "Could not delete todo.") };
  }
}

function readTodoInput(formData: FormData) {
  return {
    description: requiredText(formData, "description"),
    is_completed: checkboxValue(formData, "is_completed"),
    position: optionalInteger(formData, "position") ?? 0,
  };
}

