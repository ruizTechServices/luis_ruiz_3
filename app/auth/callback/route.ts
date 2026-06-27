import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getSafeRedirectPath, LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { createOperationId } from "@/lib/logging/shared";
import { serverLog, serverLogError } from "@/lib/logging/server";

const ROUTE_SCOPE = "auth.callback";

export async function GET(request: Request) {
  const requestId = createOperationId("auth-callback");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const origin = getRequestOrigin(request, requestUrl.origin);
  const forwardedHost = request.headers.get("x-forwarded-host");

  serverLog({
    scope: ROUTE_SCOPE,
    event: "request_started",
    requestId,
    metadata: {
      hasCode: Boolean(code),
      next,
      requestOrigin: origin,
      forwardedHost,
      nodeEnv: process.env.NODE_ENV,
    },
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      serverLog({
        scope: ROUTE_SCOPE,
        event: "code_exchange_succeeded",
        requestId,
        metadata: { next, redirectTarget: `${origin}${next}` },
      });

      revalidatePath("/", "layout");
      return NextResponse.redirect(`${origin}${next}`);
    }

    serverLogError({
      scope: ROUTE_SCOPE,
      event: "code_exchange_failed",
      requestId,
      error,
      metadata: { supabaseErrorMessage: error.message },
    });
  } else {
    serverLog({
      scope: ROUTE_SCOPE,
      level: "warn",
      event: "request_failed",
      requestId,
      metadata: { reason: "missing_code", redirectTarget: `${origin}${LOGIN_PATH}` },
    });
  }

  return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
}

function getRequestOrigin(request: Request, fallbackOrigin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return fallbackOrigin;
}
