import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { jsonError } from "@/lib/api/envelope";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  return user;
}

export async function requireApiUser(requestId: string): Promise<Response | null> {
  const user = await getAuthenticatedUser();

  if (user) {
    return null;
  }

  return jsonError(requestId, {
    code: "UNAUTHENTICATED",
    message: "Sign in to access this route.",
    status: 401,
    retryable: false,
  });
}
