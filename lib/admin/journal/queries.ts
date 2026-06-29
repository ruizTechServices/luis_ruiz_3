import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { JournalRow } from "@/lib/admin/journal/types";

const SELECT_COLUMNS = "id, created_at, updated_at, title, content, tags";

export async function listJournalRows(): Promise<JournalRow[]> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load journal rows: ${error.message}`);
  }

  return (data ?? []) as JournalRow[];
}

export async function getJournalRowById(id: number): Promise<JournalRow | null> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load journal row: ${error.message}`);
  }

  return data as JournalRow | null;
}

