import "server-only";

import { notFound } from "next/navigation";

import { requireUser, type AuthenticatedUser } from "@/lib/auth/session";

export const GIO_ADMIN_EMAIL = "giosterr44@gmail.com";

export function isGioAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === GIO_ADMIN_EMAIL;
}

export async function requireGioAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!isGioAdminEmail(user.email)) {
    notFound();
  }

  return user;
}
