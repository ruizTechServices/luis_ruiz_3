import "server-only";

import type { AuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface DashboardTable {
  label: string;
  table: string;
}

export interface DashboardMetric {
  label: string;
  count: number;
}

const DASHBOARD_TABLES: readonly DashboardTable[] = [
  { label: "Projects", table: "dashboard_projects" },
  { label: "Clients", table: "dashboard_clients" },
  { label: "Leads", table: "dashboard_leads" },
  { label: "Money entries", table: "dashboard_money_entries" },
  { label: "Decisions", table: "dashboard_decisions" },
  { label: "System links", table: "dashboard_system_links" },
] as const;

export async function getDashboardMetrics(
  user: AuthenticatedUser,
): Promise<DashboardMetric[]> {
  const supabase = await createClient();

  return Promise.all(
    DASHBOARD_TABLES.map(async ({ label, table }) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Could not load ${label.toLowerCase()}.`);
      }

      return {
        label,
        count: count ?? 0,
      };
    }),
  );
}
