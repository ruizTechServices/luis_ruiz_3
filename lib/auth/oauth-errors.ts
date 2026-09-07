import { getSafeRedirectPath, LOGIN_PATH } from "./routes";

export type OAuthFailureReason = "expired" | "denied" | "failed";

const expiredCodes = new Set(["bad_oauth_state", "flow_state_expired", "flow_state_not_found"]);
const providerCodes = new Set(["bad_oauth_callback", "oauth_provider_not_supported", "provider_disabled", "provider_email_needs_verification"]);
const providerErrors = new Set(["invalid_request", "unauthorized_client", "unsupported_response_type", "invalid_scope", "server_error", "temporarily_unavailable"]);

/** Query parameters identify a fixed message; provider descriptions are never rendered. */
export function getOAuthFailureReason(error: unknown, errorCode: unknown): OAuthFailureReason | null {
  if (typeof errorCode === "string" && expiredCodes.has(errorCode)) return "expired";
  if (error === "access_denied") return "denied";
  if (typeof errorCode === "string" && providerCodes.has(errorCode)) return "failed";
  if (typeof error === "string" && providerErrors.has(error)) return "failed";
  return null;
}

export function getOAuthFailureRedirect(reason: OAuthFailureReason, next: unknown): string {
  const params = new URLSearchParams({
    auth_error: reason,
    next: getSafeRedirectPath(typeof next === "string" ? next : null),
  });
  return `${LOGIN_PATH}?${params.toString()}`;
}

export function getOAuthFailureMessage(reason: unknown): string | null {
  switch (reason) {
    case "expired": return "That sign-in attempt expired or is no longer valid. Start a new sign-in below.";
    case "denied": return "Sign-in wasn’t approved. You can try again below.";
    case "failed": return "Sign-in couldn’t be completed. Please try again below.";
    default: return null;
  }
}
