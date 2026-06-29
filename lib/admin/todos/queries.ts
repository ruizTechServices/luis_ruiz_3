import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { TodoRow } from "@/lib/admin/todos/types";

const SELECT_COLUMNS = "id, description, is_completed, created_at, updated_at, position";

export async function listTodoRows(): Promise<TodoRow[]> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select(SELECT_COLUMNS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load todo rows: ${error.message}`);
  }

  return (data ?? []) as TodoRow[];
}

export async function getTodoRowById(id: number): Promise<TodoRow | null> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load todo row: ${error.message}`);
  }

  return data as TodoRow | null;
}

