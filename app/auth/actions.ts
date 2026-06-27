"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeRedirectPath, LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { createOperationId } from "@/lib/logging/shared";
import { serverLog, serverLogError } from "@/lib/logging/server";

const ACTION_SCOPE = "auth.actions";

export interface AuthFormState {
  message?: string;
}

export async function signInWithPassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const requestId = createOperationId("signin-password");
  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");
  const next = getSafeRedirectPath(formData.get("next"));

  serverLog({
    scope: ACTION_SCOPE,
    event: "signin_password_started",
    requestId,
    metadata: { hasEmail: Boolean(email), next },
  });

  if (!email || !password) {
    serverLog({
      scope: ACTION_SCOPE,
      level: "warn",
      event: "signin_password_failed",
      requestId,
      metadata: { reason: "missing_credentials" },
    });
    return { message: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    serverLog({
      scope: ACTION_SCOPE,
      level: "warn",
      event: "signin_password_failed",
      requestId,
      metadata: { supabaseErrorMessage: error.message, supabaseErrorCode: error.code },
    });
    return { message: error.message };
  }

  serverLog({
    scope: ACTION_SCOPE,
    event: "signin_password_succeeded",
    requestId,
    metadata: { next },
  });

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const requestId = createOperationId("signup-password");
  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");
  const next = getSafeRedirectPath(formData.get("next"));

  serverLog({
    scope: ACTION_SCOPE,
    event: "signup_password_started",
    requestId,
    metadata: { hasEmail: Boolean(email), next },
  });

  if (!email || !password) {
    serverLog({
      scope: ACTION_SCOPE,
      level: "warn",
      event: "signup_password_failed",
      requestId,
      metadata: { reason: "missing_credentials" },
    });
    return { message: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    serverLog({
      scope: ACTION_SCOPE,
      level: "warn",
      event: "signup_password_failed",
      requestId,
      metadata: { supabaseErrorMessage: error.message, supabaseErrorCode: error.code },
    });
    return { message: error.message };
  }

  serverLog({
    scope: ACTION_SCOPE,
    event: "signup_password_succeeded",
    requestId,
    metadata: { next },
  });

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const requestId = createOperationId("signin-google");
  const next = getSafeRedirectPath(formData.get("next"));
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  serverLog({
    scope: ACTION_SCOPE,
    event: "signin_google_started",
    requestId,
    metadata: { origin, next, callbackUrl: callbackUrl.toString() },
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    serverLogError({
      scope: ACTION_SCOPE,
      event: "signin_google_failed",
      requestId,
      error: error ?? new Error("Supabase returned no OAuth URL."),
      metadata: { origin, callbackUrl: callbackUrl.toString() },
    });
    redirect(LOGIN_PATH);
  }

  serverLog({
    scope: ACTION_SCOPE,
    event: "signin_google_redirect_succeeded",
    requestId,
    metadata: {
      origin,
      callbackUrl: callbackUrl.toString(),
      redirectToHost: new URL(data.url).host,
    },
  });

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const requestId = createOperationId("signout");

  serverLog({ scope: ACTION_SCOPE, event: "signout_started", requestId });

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  serverLog({ scope: ACTION_SCOPE, event: "signout_succeeded", requestId });

  redirect(LOGIN_PATH);
}

function getRequiredString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
