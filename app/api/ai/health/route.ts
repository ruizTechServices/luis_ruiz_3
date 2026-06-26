import { fetchWithTimeout, isFetchTimeoutError } from "@/lib/api/fetch-with-timeout";
import { safeJson } from "@/lib/api/safe-json";
import { requireApiUser } from "@/lib/auth/session";
import { getOllamaConfig } from "@/lib/ai/ollama-config";
import { createOperationId, startTimer } from "@/lib/logging/shared";
import { serverLog, serverLogError } from "@/lib/logging/server";

const ROUTE_SCOPE = "api.ai.health";

export const runtime = "nodejs";
export const maxDuration = 10;

interface OllamaVersionResponse {
  version?: string;
  error?: string;
}

interface HealthErrorBody {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
}

export async function GET(request: Request) {
  const requestId =
    request.headers.get("x-operation-id") ?? createOperationId("health");
  const duration = startTimer();
  const { baseUrl } = getOllamaConfig();

  serverLog({
    scope: ROUTE_SCOPE,
    event: "request_started",
    requestId,
    metadata: {
      hasClientOperationId: request.headers.has("x-operation-id"),
    },
  });

  try {
    const unauthenticatedResponse = await requireApiUser(requestId);

    if (unauthenticatedResponse) {
      return unauthenticatedResponse;
    }

    const ollamaResponse = await fetchWithTimeout(`${baseUrl}/api/version`, {
      method: "GET",
      timeoutMs: 4_000,
      cache: "no-store",
    });
    const dataResult = await safeJson<OllamaVersionResponse>(ollamaResponse);

    if (!dataResult.ok) {
      return healthFailure(
        requestId,
        duration(),
        "OLLAMA_INVALID_JSON",
        "Nano health check returned invalid JSON.",
        502,
        true,
        {
          upstreamStatus: ollamaResponse.status,
          upstreamBodyLength: dataResult.rawText.length,
        },
      );
    }

    if (!ollamaResponse.ok) {
      return healthFailure(
        requestId,
        duration(),
        "OLLAMA_HTTP_ERROR",
        dataResult.data.error ?? "Nano health check failed.",
        ollamaResponse.status,
        true,
        {
          upstreamStatus: ollamaResponse.status,
        },
      );
    }

    const durationMs = duration();

    serverLog({
      scope: ROUTE_SCOPE,
      event: "request_succeeded",
      requestId,
      durationMs,
      metadata: {
        online: true,
        hasVersion: Boolean(dataResult.data.version),
      },
    });

    return Response.json({
      ok: true,
      requestId,
      online: true,
      version: dataResult.data.version ?? null,
    });
  } catch (error) {
    return handleUnexpectedError(requestId, duration(), error);
  }
}

function handleUnexpectedError(
  requestId: string,
  durationMs: number,
  error: unknown,
): Response {
  const isTimeout = isFetchTimeoutError(error);
  const code = isTimeout ? "OLLAMA_CONNECT_TIMEOUT" : "OLLAMA_FETCH_FAILED";
  const message = isTimeout
    ? "Nano health check timed out. Check Tailscale, Docker, and ollama-gpu."
    : "Nano health check could not reach the Ollama endpoint.";

  serverLogError({
    scope: ROUTE_SCOPE,
    event: "request_failed",
    requestId,
    durationMs,
    error,
    metadata: {
      code,
      online: false,
    },
  });

  return healthErrorResponse(requestId, {
    code,
    message,
    status: 503,
    retryable: true,
  });
}

function healthFailure(
  requestId: string,
  durationMs: number,
  code: string,
  message: string,
  status: number,
  retryable: boolean,
  metadata?: Record<string, unknown>,
): Response {
  serverLog({
    level: "error",
    scope: ROUTE_SCOPE,
    event: "request_failed",
    requestId,
    durationMs,
    metadata: {
      code,
      status,
      retryable,
      online: false,
      ...metadata,
    },
  });

  return healthErrorResponse(requestId, {
    code,
    message,
    status: status >= 500 ? 503 : status,
    retryable,
  });
}

function healthErrorResponse(
  requestId: string,
  error: HealthErrorBody,
): Response {
  return Response.json(
    {
      ok: false,
      requestId,
      online: false,
      version: null,
      error,
    },
    {
      status: error.status,
    },
  );
}
