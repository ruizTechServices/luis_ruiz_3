import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/admin/documents/types";

const SELECT_COLUMNS = "id, created_at, updated_at, title, content, source, url";

export async function listDocumentRows(): Promise<DocumentRow[]> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load document rows: ${error.message}`);
  }

  return (data ?? []) as DocumentRow[];
}

export async function getDocumentRowById(id: number): Promise<DocumentRow | null> {
  await requireGioAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load document row: ${error.message}`);
  }

  return data as DocumentRow | null;
}

