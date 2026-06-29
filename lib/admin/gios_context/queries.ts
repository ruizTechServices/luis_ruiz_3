import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { GiosContextRow } from "@/lib/admin/gios_context/types";

const SELECT_COLUMNS = "id, created_at, session_id, message_id, role, model, source, content, user_id";

export async function listGiosContextRows(): Promise<GiosContextRow[]> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gios_context")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load Gio context rows: ${error.message}`);
  }

  return (data ?? []) as GiosContextRow[];
}

export async function getGiosContextRowById(id: number): Promise<GiosContextRow | null> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gios_context")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load Gio context row: ${error.message}`);
  }

  return data as GiosContextRow | null;
}

