"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminRecord as createRecord,
  deleteAdminRecord as deleteRecord,
  updateAdminRecord as updateRecord,
} from "@/lib/admin/mutations";
import { readString, requireFormId } from "@/lib/data/form";

function revalidateAdminViews(table: string): void {
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  if (table === "projects") {
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/projects/[slug]", "page");
    revalidatePath("/sitemap");
    revalidatePath("/sitemap.xml");
  }

  if (table === "site-settings") {
    revalidatePath("/");
    revalidatePath("/contact");
  }
}

export async function createAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");

  await createRecord(table, formData);
  revalidateAdminViews(table);
}

export async function updateAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await updateRecord(table, id, formData);
  revalidateAdminViews(table);
}

export async function deleteAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await deleteRecord(table, id);
  revalidateAdminViews(table);
}
