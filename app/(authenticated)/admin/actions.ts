"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminRecord as createRecord,
  deleteAdminRecord as deleteRecord,
  updateAdminRecord as updateRecord,
} from "@/lib/admin/mutations";
import { readString, requireFormId } from "@/lib/data/form";

export async function createAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");

  await createRecord(table, formData);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin");
}

export async function updateAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await updateRecord(table, id, formData);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin");
}

export async function deleteAdminRecord(formData: FormData): Promise<void> {
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await deleteRecord(table, id);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin");
}
