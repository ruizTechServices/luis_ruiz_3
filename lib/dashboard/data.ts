import "server-only";

import type { AuthenticatedUser } from "@/lib/auth/session";
import { dynamicTable } from "@/lib/supabase/dynamic-table";
import { createClient } from "@/lib/supabase/server";

export type DashboardFieldType = "text" | "textarea" | "number" | "date";

export interface DashboardField {
  name: string;
  label: string;
  type?: DashboardFieldType;
  required?: boolean;
}

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

export const DASHBOARD_PAGE_TABLES = [
  {
    slug: "projects",
    label: "Projects",
    table: "dashboard_projects",
    select:
      "id, created_at, updated_at, name, slug, type, status, priority, repo_url, live_url, description, next_action, revenue_potential, last_touched_at, user_id",
    orderBy: "updated_at",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "type", label: "Type", required: true },
      { name: "status", label: "Status", required: true },
      { name: "priority", label: "Priority", type: "number" },
      { name: "repo_url", label: "Repo URL" },
      { name: "live_url", label: "Live URL" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "next_action", label: "Next action", type: "textarea" },
      { name: "revenue_potential", label: "Revenue potential", type: "number" },
    ],
  },
  {
    slug: "clients",
    label: "Clients",
    table: "dashboard_clients",
    select: "id, created_at, updated_at, name, email, phone, business_name, status, notes, user_id",
    orderBy: "updated_at",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "business_name", label: "Business name" },
      { name: "status", label: "Status", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    slug: "leads",
    label: "Leads",
    table: "dashboard_leads",
    select:
      "id, created_at, updated_at, name, business_name, email, phone, source, problem, budget, status, next_follow_up_at, notes, user_id",
    orderBy: "updated_at",
    fields: [
      { name: "name", label: "Name" },
      { name: "business_name", label: "Business name" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "source", label: "Source" },
      { name: "problem", label: "Problem", type: "textarea" },
      { name: "budget", label: "Budget", type: "number" },
      { name: "status", label: "Status", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    slug: "money",
    label: "Money entries",
    table: "dashboard_money_entries",
    select:
      "id, created_at, entry_type, category, description, amount, occurred_on, project_id, client_id, user_id",
    orderBy: "occurred_on",
    fields: [
      { name: "entry_type", label: "Entry type", required: true },
      { name: "category", label: "Category", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "occurred_on", label: "Occurred on", type: "date" },
      { name: "project_id", label: "Project ID" },
      { name: "client_id", label: "Client ID" },
    ],
  },
  {
    slug: "decisions",
    label: "Decisions",
    table: "dashboard_decisions",
    select: "id, created_at, updated_at, title, decision, reason, project_id, status, revisit_at, user_id",
    orderBy: "updated_at",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "decision", label: "Decision", type: "textarea", required: true },
      { name: "reason", label: "Reason", type: "textarea" },
      { name: "project_id", label: "Project ID" },
      { name: "status", label: "Status", required: true },
      { name: "revisit_at", label: "Revisit at" },
    ],
  },
  {
    slug: "links",
    label: "System links",
    table: "dashboard_system_links",
    select: "id, created_at, updated_at, name, url, description, type, status, priority, user_id",
    orderBy: "updated_at",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "url", label: "URL", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "type", label: "Type", required: true },
      { name: "status", label: "Status", required: true },
      { name: "priority", label: "Priority", type: "number" },
    ],
  },
] as const;

export type DashboardPageConfig = (typeof DASHBOARD_PAGE_TABLES)[number];
export type DashboardRowValue = string | number | boolean | null;
export type DashboardRow = Record<string, DashboardRowValue>;

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

export function getDashboardPageConfig(slug: string): DashboardPageConfig {
  const config = DASHBOARD_PAGE_TABLES.find((tableConfig) => tableConfig.slug === slug);

  if (!config) {
    throw new Error(`Unknown dashboard table: ${slug}`);
  }

  return config;
}

export async function getDashboardRows(
  user: AuthenticatedUser,
  slug: string,
): Promise<{ config: DashboardPageConfig; rows: DashboardRow[] }> {
  const config = getDashboardPageConfig(slug);
  const supabase = await createClient();
  let query = dynamicTable(supabase, config.table)
    .select(config.select)
    .eq("user_id", user.id)
    .limit(100);

  if (config.orderBy) {
    query = query.order(config.orderBy, { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load ${config.label.toLowerCase()}.`);
  }

  return { config, rows: (data ?? []) as unknown as DashboardRow[] };
}
