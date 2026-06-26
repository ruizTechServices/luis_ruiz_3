import {
  createLogId,
  nowIso,
  sanitizeMetadata,
  serializeError,
  type LogEvent,
  type LogLevel,
  type LogMetadata,
} from "@/lib/logging/shared";

interface ServerLogInput {
  level?: LogLevel;
  scope: string;
  event: string;
  operationId?: string;
  requestId?: string;
  durationMs?: number;
  metadata?: LogMetadata;
}

export function serverLog(input: ServerLogInput): LogEvent {
  const event: LogEvent = {
    id: createLogId("srv"),
    timestamp: nowIso(),
    level: input.level ?? "info",
    scope: input.scope,
    event: input.event,
    operationId: input.operationId,
    requestId: input.requestId,
    durationMs: input.durationMs,
    metadata: sanitizeMetadata(input.metadata),
  };

  writeConsole(event);

  return event;
}

export function serverLogError(
  input: Omit<ServerLogInput, "level" | "metadata"> & {
    error: unknown;
    metadata?: LogMetadata;
  },
): LogEvent {
  return serverLog({
    ...input,
    level: "error",
    metadata: {
      ...input.metadata,
      serializedError: serializeError(input.error),
    },
  });
}

function writeConsole(event: LogEvent): void {
  const payload = JSON.stringify(event);

  switch (event.level) {
    case "debug":
      console.debug(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
    default:
      console.info(payload);
      break;
  }
}
