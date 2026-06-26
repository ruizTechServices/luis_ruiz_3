export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogMetadata = Record<string, unknown>;

export interface LogEvent {
  id: string;
  timestamp: string;
  level: LogLevel;
  scope: string;
  event: string;
  operationId?: string;
  requestId?: string;
  durationMs?: number;
  metadata?: LogMetadata;
}

export interface SerializedError {
  name: string;
  message: string;
  code?: string;
  causeName?: string;
  causeMessage?: string;
  causeCode?: string;
}

export function createLogId(prefix = "log"): string {
  return `${prefix}_${createShortId()}`;
}

export function createOperationId(prefix = "op"): string {
  return `${prefix}_${createShortId()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function startTimer(): () => number {
  const start = performance.now();

  return () => Math.round(performance.now() - start);
}

export function sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: String(error),
    };
  }

  const cause = error.cause;

  return {
    name: error.name,
    message: error.message,
    code: getErrorCode(error),
    causeName: cause instanceof Error ? cause.name : undefined,
    causeMessage: cause instanceof Error ? cause.message : undefined,
    causeCode: cause instanceof Error ? getErrorCode(cause) : undefined,
  };
}

export function getErrorCode(error: Error): string | undefined {
  const withCode = error as Error & { code?: unknown };

  return typeof withCode.code === "string" ? withCode.code : undefined;
}

function createShortId(): string {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) ?? fallbackShortId();
}

function fallbackShortId(): string {
  return Math.random().toString(36).slice(2, 10);
}
