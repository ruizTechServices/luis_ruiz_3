export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

export class FetchTimeoutError extends Error {
  code = "FETCH_TIMEOUT";

  constructor(timeoutMs: number) {
    super(`Fetch timed out after ${timeoutMs}ms.`);
    this.name = "FetchTimeoutError";
  }
}

export function isFetchTimeoutError(error: unknown): boolean {
  if (error instanceof FetchTimeoutError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const cause = error.cause;

  if (cause instanceof Error) {
    const causeWithCode = cause as Error & { code?: unknown };

    return causeWithCode.code === "UND_ERR_CONNECT_TIMEOUT";
  }

  const errorWithCode = error as Error & { code?: unknown };

  return errorWithCode.code === "UND_ERR_CONNECT_TIMEOUT";
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...fetchInit } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new FetchTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
