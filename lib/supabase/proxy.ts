import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthPath, isProtectedApiPath, isProtectedPagePath, LOGIN_PATH } from "@/lib/auth/routes";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { serverLog } from "@/lib/logging/server";

const PROXY_SCOPE = "auth.proxy";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const requiresAuth = isProtectedPagePath(pathname) || isProtectedApiPath(pathname);
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (!isAuthenticated && isProtectedApiPath(pathname)) {
    serverLog({
      scope: PROXY_SCOPE,
      level: "warn",
      event: "unauthenticated_api_request",
      metadata: { pathname },
    });

    return Response.json(
      {
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Sign in to access this route.",
          status: 401,
          retryable: false,
        },
      },
      { status: 401 },
    );
  }

  if (!isAuthenticated && isProtectedPagePath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    serverLog({
      scope: PROXY_SCOPE,
      event: "redirect_to_login",
      metadata: { pathname, next: redirectUrl.searchParams.get("next") },
    });

    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isAuthPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    redirectUrl.search = "";

    serverLog({
      scope: PROXY_SCOPE,
      event: "redirect_authenticated_to_account",
      metadata: { pathname },
    });

    return NextResponse.redirect(redirectUrl);
  }

  serverLog({
    scope: PROXY_SCOPE,
    level: "debug",
    event: "pass_through",
    metadata: { pathname, requiresAuth, isAuthenticated },
  });

  return response;
}
