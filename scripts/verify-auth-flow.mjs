import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  [
    "navigation links live in shared config",
    "lib/navigation/nav-links.ts",
    (source) =>
      hasAll(source, [
        'href: "/account"',
        'href: "/dashboard"',
        'visibility: "authenticated"',
        'href: "/login?next=%2Faccount"',
        'visibility: "anonymous"',
      ]),
  ],
  [
    "navbar renders shared links by server auth state",
    "components/navigation/site-navbar.tsx",
    (source) =>
      hasAll(source, [
        "navLinks.filter",
        "getAuthenticatedUser",
        "isAuthenticated",
        "visibleLinks.map",
      ]),
  ],
  [
    "root layout renders navbar",
    "app/layout.tsx",
    (source) => hasAll(source, ["SiteNavbar", "<SiteNavbar />"]),
  ],
  [
    "auth route config protects account and AI APIs",
    "lib/auth/routes.ts",
    (source) =>
      hasAll(source, [
        'const PROTECTED_PAGE_PREFIXES = ["/account", "/dashboard", "/admin"]',
        'const PROTECTED_API_PREFIXES = ["/api/ai"]',
        "getSafeRedirectPath",
        'value.startsWith("//")',
      ]),
  ],
  [
    "server session helper verifies Supabase claims",
    "lib/auth/session.ts",
    (source) =>
      hasAll(source, [
        "supabase.auth.getClaims()",
        "claims.sub",
        "redirect(LOGIN_PATH)",
        'code: "UNAUTHENTICATED"',
      ]),
  ],
  [
    "proxy enforces protected page and API entry",
    "lib/supabase/proxy.ts",
    (source) =>
      hasAll(source, [
        "supabase.auth.getClaims()",
        "isProtectedPagePath(pathname)",
        "isProtectedApiPath(pathname)",
        "NextResponse.redirect(redirectUrl)",
        'redirectUrl.pathname = LOGIN_PATH',
      ]),
  ],
  [
    "project proxy delegates to Supabase session updater",
    "proxy.ts",
    (source) => hasAll(source, ["updateSession", "export async function proxy", "matcher"]),
  ],
  [
    "authenticated route group gates all children",
    "app/(authenticated)/layout.tsx",
    (source) => hasAll(source, ["await requireUser()", "AuthenticatedMarker"]),
  ],
  [
    "account page resolves current user server-side",
    "app/(authenticated)/account/page.tsx",
    (source) => hasAll(source, ["await requireUser()", "user.email ?? user.id"]),
  ],
  [
    "dashboard page resolves current user server-side",
    "app/(authenticated)/dashboard/page.tsx",
    (source) => hasAll(source, ["await requireUser()", "getDashboardMetrics(user)"]),
  ],
  [
    "dashboard data is scoped to verified user id",
    "lib/dashboard/data.ts",
    (source) =>
      hasAll(source, [
        "server-only",
        "user: AuthenticatedUser",
        '.eq("user_id", user.id)',
      ]),
  ],
  [
    "OAuth callback exchanges code for server session",
    "app/auth/callback/route.ts",
    (source) =>
      hasAll(source, [
        "exchangeCodeForSession(code)",
        'revalidatePath("/", "layout")',
        "getSafeRedirectPath",
      ]),
  ],
  [
    "AI chat API requires authenticated user",
    "app/api/ai/chat/route.ts",
    (source) => hasAll(source, ["requireApiUser", "await requireApiUser(requestId)"]),
  ],
  [
    "AI embed API requires authenticated user",
    "app/api/ai/embed/route.ts",
    (source) => hasAll(source, ["requireApiUser", "await requireApiUser(requestId)"]),
  ],
  [
    "AI health API requires authenticated user",
    "app/api/ai/health/route.ts",
    (source) => hasAll(source, ["requireApiUser", "await requireApiUser(requestId)"]),
  ],
  [
    "auth actions log sign-in/up/out and the Google OAuth redirect target",
    "app/auth/actions.ts",
    (source) =>
      hasAll(source, [
        "serverLog",
        "ACTION_SCOPE",
        "signin_google_redirect_succeeded",
        "redirectToHost",
      ]),
  ],
  [
    "OAuth callback route logs code exchange outcome",
    "app/auth/callback/route.ts",
    (source) =>
      hasAll(source, [
        "serverLog",
        "ROUTE_SCOPE",
        "code_exchange_succeeded",
        "code_exchange_failed",
      ]),
  ],
  [
    "proxy logs every auth decision branch",
    "lib/supabase/proxy.ts",
    (source) =>
      hasAll(source, [
        "serverLog",
        "PROXY_SCOPE",
        "redirect_to_login",
        "unauthenticated_api_request",
        "pass_through",
      ]),
  ],
  [
    "session helper logs claim resolution failures",
    "lib/auth/session.ts",
    (source) => hasAll(source, ["serverLogError", "get_claims_failed", "SESSION_SCOPE"]),
  ],
];

const failures = [];

for (const [label, relativePath, verify] of checks) {
  const filePath = path.join(root, relativePath);
  const source = read(filePath);

  if (!verify(source)) {
    failures.push(`${label}: ${relativePath}`);
  }
}

const appRoutes = listFiles(path.join(root, "app"));
const userIdRoutes = appRoutes.filter((filePath) => {
  const normalized = filePath.replaceAll(path.sep, "/");
  return normalized.includes("[userId]") || normalized.includes("[user_id]");
});

if (userIdRoutes.length > 0) {
  failures.push(`user-controlled account/dashboard route ids found: ${userIdRoutes.join(", ")}`);
}

const scannedSources = ["app", "components", "lib"]
  .flatMap((directory) => listFiles(path.join(root, directory)))
  .filter((filePath) => /\.(ts|tsx|js|jsx)$/.test(filePath))
  .map((filePath) => [filePath, read(filePath)]);

for (const [filePath, source] of scannedSources) {
  if (source.includes("auth.getSession(")) {
    failures.push(`unverified auth.getSession usage found: ${path.relative(root, filePath)}`);
  }
}

if (failures.length > 0) {
  console.error("Auth flow verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Auth flow verification passed.");

function read(filePath) {
  if (!existsSync(filePath)) {
    failures.push(`missing file: ${path.relative(root, filePath)}`);
    return "";
  }

  return readFileSync(filePath, "utf8");
}

function hasAll(source, needles) {
  return needles.every((needle) => source.includes(needle));
}

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    const stats = statSync(filePath);

    return stats.isDirectory() ? listFiles(filePath) : [filePath];
  });
}
