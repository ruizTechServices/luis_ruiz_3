"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  createDashboardRecord as createRecord,
  deleteDashboardRecord as deleteRecord,
  updateDashboardRecord as updateRecord,
} from "@/lib/dashboard/mutations";
import { readString, requireFormId } from "@/lib/data/form";

export async function createDashboardRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  const table = readString(formData, "table");

  await createRecord(user, table, formData);
  revalidatePath(`/dashboard/${table}`);
  revalidatePath("/dashboard");
}

export async function updateDashboardRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await updateRecord(user, table, id, formData);
  revalidatePath(`/dashboard/${table}`);
  revalidatePath("/dashboard");
}

export async function deleteDashboardRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  const table = readString(formData, "table");
  const id = requireFormId(formData);

  await deleteRecord(user, table, id);
  revalidatePath(`/dashboard/${table}`);
  revalidatePath("/dashboard");
}
