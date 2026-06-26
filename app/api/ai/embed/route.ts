import { fetchWithTimeout, isFetchTimeoutError } from "@/lib/api/fetch-with-timeout";
import { jsonError, jsonSuccess } from "@/lib/api/envelope";
import { readRequestJson, safeJson } from "@/lib/api/safe-json";
import { getOllamaConfig } from "@/lib/ai/ollama-config";
import { createOperationId, startTimer } from "@/lib/logging/shared";
import { serverLog, serverLogError } from "@/lib/logging/server";

const ROUTE_SCOPE = "api.ai.embed";

export const runtime = "nodejs";
export const maxDuration = 90;

interface EmbedRequestBody {
  input?: unknown;
}

interface OllamaEmbedResponse {
  embeddings?: number[][];
  embedding?: number[];
  error?: string;
}

export async function POST(request: Request) {
  const requestId =
    request.headers.get("x-operation-id") ?? createOperationId("embed");
  const duration = startTimer();
  const { embedModel, embeddingProfileId, baseUrl } = getOllamaConfig();

  serverLog({
    scope: ROUTE_SCOPE,
    event: "request_started",
    requestId,
    metadata: {
      method: "POST",
      model: embedModel,
      hasClientOperationId: request.headers.has("x-operation-id"),
    },
  });

  try {
    const bodyResult = await readRequestJson<EmbedRequestBody>(request);

    if (!bodyResult.ok) {
      return fail(requestId, duration(), "VALIDATION_ERROR", bodyResult.error, 400, false);
    }

    const input = typeof bodyResult.data.input === "string"
      ? bodyResult.data.input.trim()
      : "";

    if (!input) {
      return fail(
        requestId,
        duration(),
        "VALIDATION_ERROR",
        "Input is required.",
        400,
        false,
      );
    }

    serverLog({
      scope: ROUTE_SCOPE,
      event: "ollama_request_started",
      requestId,
      metadata: {
        inputLength: input.length,
        model: embedModel,
      },
    });

    const ollamaResponse = await fetchWithTimeout(`${baseUrl}/api/embed`, {
      method: "POST",
      timeoutMs: 60_000,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embedModel,
        input,
        keep_alive: "10m",
      }),
    });
    const dataResult = await safeJson<OllamaEmbedResponse>(ollamaResponse);

    if (!dataResult.ok) {
      return fail(
        requestId,
        duration(),
        "OLLAMA_INVALID_JSON",
        dataResult.error,
        502,
        true,
        {
          upstreamStatus: ollamaResponse.status,
          upstreamBodyLength: dataResult.rawText.length,
        },
      );
    }

    if (!ollamaResponse.ok) {
      return fail(
        requestId,
        duration(),
        "OLLAMA_HTTP_ERROR",
        dataResult.data.error ?? "Ollama embedding request failed.",
        ollamaResponse.status,
        true,
        {
          upstreamStatus: ollamaResponse.status,
        },
      );
    }

    const embedding = dataResult.data.embeddings?.[0] ?? dataResult.data.embedding;

    if (!embedding?.length) {
      return fail(
        requestId,
        duration(),
        "OLLAMA_EMPTY_EMBEDDING",
        "Ollama returned an empty embedding.",
        502,
        true,
      );
    }

    const durationMs = duration();

    serverLog({
      scope: ROUTE_SCOPE,
      event: "request_succeeded",
      requestId,
      durationMs,
      metadata: {
        dimensions: embedding.length,
        model: embedModel,
      },
    });

    return jsonSuccess(requestId, {
      model: embedModel,
      profileId: embeddingProfileId,
      dimensions: embedding.length,
      embedding,
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
    ? "Nano connection timed out. Check Tailscale, Docker, and Ollama."
    : "Could not reach the Nano Ollama endpoint.";

  serverLogError({
    scope: ROUTE_SCOPE,
    event: "request_failed",
    requestId,
    durationMs,
    error,
    metadata: {
      code,
    },
  });

  return jsonError(requestId, {
    code,
    message,
    status: 502,
    retryable: true,
  });
}

function fail(
  requestId: string,
  durationMs: number,
  code: string,
  message: string,
  status: number,
  retryable: boolean,
  metadata?: Record<string, unknown>,
): Response {
  serverLog({
    level: status >= 500 ? "error" : "warn",
    scope: ROUTE_SCOPE,
    event: "request_failed",
    requestId,
    durationMs,
    metadata: {
      code,
      status,
      retryable,
      ...metadata,
    },
  });

  return jsonError(requestId, {
    code,
    message,
    status,
    retryable,
  });
}
