import "server-only";

import { ADMIN_TABLES, getAdminTableConfig, type AdminTableConfig } from "@/lib/admin/config";
import { requireGioAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { dynamicTable } from "@/lib/supabase/dynamic-table";

export type AdminRowValue = string | number | boolean | null | string[];
export type AdminRow = Record<string, AdminRowValue>;

const LEGACY_TABLES = [
  "conversations",
  "chat_messages",
  "chat_embeddings",
  "round_robin_sessions",
  "round_robin_messages",
] as const;

export async function getAdminOverview() {
  await requireGioAdmin();

  const [adminCounts, legacyCounts] = await Promise.all([
    Promise.all(ADMIN_TABLES.map((config) => countTable(config.table))),
    Promise.all(LEGACY_TABLES.map((table) => countTable(table))),
  ]);

  return {
    adminCounts: ADMIN_TABLES.map((config, index) => ({
      slug: config.slug,
      title: config.title,
      description: config.description,
      count: adminCounts[index],
    })),
    legacyCounts: LEGACY_TABLES.map((table, index) => ({ table, count: legacyCounts[index] })),
  };
}

export async function getAdminRows(slug: string): Promise<{
  config: AdminTableConfig;
  rows: AdminRow[];
}> {
  await requireGioAdmin();

  const config = getAdminTableConfig(slug);
  const supabase = await createClient();
  let query = dynamicTable(supabase, config.table).select(config.select).limit(100);

  if (config.orderBy) {
    query = query.order(config.orderBy, { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load ${config.title.toLowerCase()}.`);
  }

  return {
    config,
    rows: (data ?? []) as unknown as AdminRow[],
  };
}

async function countTable(table: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await dynamicTable(supabase, table).select("*", {
    count: "exact",
    head: true,
  });

  if (error) {
    return 0;
  }

  return count ?? 0;
}
