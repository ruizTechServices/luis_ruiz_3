import "server-only";

import { notFound } from "next/navigation";

import { requireUser, type AuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function isGioAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_gio_admin");

  return !error && data === true;
}

export async function requireGioAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!(await isGioAdmin())) {
    notFound();
  }

  return user;
}
