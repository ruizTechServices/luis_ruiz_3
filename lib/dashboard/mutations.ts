import "server-only";

import type { AuthenticatedUser } from "@/lib/auth/session";
import { getDashboardPageConfig, type DashboardField, type DashboardPageConfig } from "@/lib/dashboard/data";
import { readOptionalString, readString } from "@/lib/data/form";
import { dynamicTable } from "@/lib/supabase/dynamic-table";
import { createClient } from "@/lib/supabase/server";

type DashboardPayload = Record<string, string | number | null>;

export async function createDashboardRecord(
  user: AuthenticatedUser,
  slug: string,
  formData: FormData,
): Promise<void> {
  const config = getDashboardPageConfig(slug);
  const payload = { ...buildPayload(config, formData), user_id: user.id };
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table).insert(payload);

  if (error) {
    throw new Error(`Could not create ${config.label.toLowerCase()}.`);
  }
}

export async function updateDashboardRecord(
  user: AuthenticatedUser,
  slug: string,
  id: string,
  formData: FormData,
): Promise<void> {
  const config = getDashboardPageConfig(slug);
  const payload = buildPayload(config, formData);
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table)
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Could not update ${config.label.toLowerCase()}.`);
  }
}

export async function deleteDashboardRecord(
  user: AuthenticatedUser,
  slug: string,
  id: string,
): Promise<void> {
  const config = getDashboardPageConfig(slug);
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Could not delete ${config.label.toLowerCase()}.`);
  }
}

function buildPayload(config: DashboardPageConfig, formData: FormData): DashboardPayload {
  return Object.fromEntries(
    config.fields.map((field) => [field.name, readFieldValue(field, formData)]),
  ) as DashboardPayload;
}

function readFieldValue(field: DashboardField, formData: FormData): string | number | null {
  const value = field.required
    ? readString(formData, field.name)
    : readOptionalString(formData, field.name);

  if (field.required && !value) {
    throw new Error(`${field.label} is required.`);
  }

  if (field.type === "number" && value !== null) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      throw new Error(`${field.label} must be a number.`);
    }

    return numericValue;
  }

  return value;
}
