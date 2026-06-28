import "server-only";

import {
  getDeletableAdminTableConfig,
  getMutableAdminTableConfig,
  type AdminField,
  type AdminTableConfig,
} from "@/lib/admin/config";
import { requireGioAdmin } from "@/lib/auth/admin";
import { readBoolean, readOptionalString, readString } from "@/lib/data/form";
import { dynamicTable } from "@/lib/supabase/dynamic-table";
import { createClient } from "@/lib/supabase/server";

type AdminPayload = Record<string, string | boolean | null>;

export async function createAdminRecord(slug: string, formData: FormData): Promise<void> {
  await requireGioAdmin();

  const config = getMutableAdminTableConfig(slug);
  const payload = buildPayload(config, formData);
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table).insert(payload);

  if (error) {
    throw new Error(`Could not create ${config.title.toLowerCase()}.`);
  }
}

export async function updateAdminRecord(slug: string, id: string, formData: FormData): Promise<void> {
  await requireGioAdmin();

  const config = getMutableAdminTableConfig(slug);
  const payload = buildPayload(config, formData);
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table).update(payload).eq("id", id);

  if (error) {
    throw new Error(`Could not update ${config.title.toLowerCase()}.`);
  }
}

export async function deleteAdminRecord(slug: string, id: string): Promise<void> {
  await requireGioAdmin();

  const config = getDeletableAdminTableConfig(slug);
  const supabase = await createClient();
  const { error } = await dynamicTable(supabase, config.table).delete().eq("id", id);

  if (error) {
    throw new Error(`Could not delete ${config.title.toLowerCase()}.`);
  }
}

function buildPayload(config: AdminTableConfig, formData: FormData): AdminPayload {
  return Object.fromEntries(
    config.fields.map((field) => [field.name, readFieldValue(field, formData)]),
  ) as AdminPayload;
}

function readFieldValue(field: AdminField, formData: FormData): string | boolean | null {
  if (field.type === "checkbox") {
    return readBoolean(formData, field.name);
  }

  const value = field.required
    ? readString(formData, field.name)
    : readOptionalString(formData, field.name);

  if (field.required && !value) {
    throw new Error(`${field.label} is required.`);
  }

  return value;
}
