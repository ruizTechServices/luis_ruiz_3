export const LOGIN_PATH = "/login";
export const DEFAULT_AUTH_REDIRECT_PATH = "/account";

const PROTECTED_PAGE_PREFIXES = ["/account", "/dashboard", "/admin"];
const PROTECTED_API_PREFIXES = ["/api/ai"];

export function isProtectedPagePath(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/auth");
}

export function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (value.startsWith(LOGIN_PATH) || value.startsWith("/auth")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return value;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
