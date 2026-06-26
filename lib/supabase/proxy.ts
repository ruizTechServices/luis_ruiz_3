import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthPath, isProtectedApiPath, isProtectedPagePath, LOGIN_PATH } from "@/lib/auth/routes";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

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
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isAuthPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!requiresAuth && !isAuthPath(pathname)) {
    return response;
  }

  return response;
}
