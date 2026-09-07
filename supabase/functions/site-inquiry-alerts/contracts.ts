export type AlertAction = "status" | "process" | "test" | "retry";
export type ProviderResult = { accepted: true; id: string } | { accepted: false; retryable: boolean; code: string };

export function parseAction(value: unknown): AlertAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const action = (value as Record<string, unknown>).action;
  return action === "status" || action === "process" || action === "test" || action === "retry" ? action : null;
}

export function classifyProviderResponse(status: number, value: unknown): ProviderResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (status >= 200 && status < 300 && typeof body.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(body.id)) {
    return { accepted: true, id: body.id };
  }
  if (status === 409 && body.name === "invalid_idempotent_request") {
    return { accepted: false, retryable: false, code: "payload_conflict" };
  }
  if (status === 429 || status === 408 || status >= 500 || (status === 409 && body.name === "concurrent_idempotent_requests")) {
    return { accepted: false, retryable: true, code: status === 429 ? "provider_rate_limit" : "provider_retryable" };
  }
  if (status >= 200 && status < 300) return { accepted: false, retryable: true, code: "provider_unknown_result" };
  return { accepted: false, retryable: false, code: status === 401 || status === 403 ? "provider_credentials" : "provider_rejected" };
}

export async function readAlertBody(request: Request): Promise<unknown> {
  const advertised = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(advertised) || advertised > 512 || !request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 512) { await reader.cancel(); throw new Error("body_too_large"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
