"use client";

import {
  createLogId,
  nowIso,
  sanitizeMetadata,
  serializeError,
  type LogEvent,
  type LogLevel,
  type LogMetadata,
} from "@/lib/logging/shared";

const MAX_CLIENT_LOGS = 120;

type ClientLogListener = (events: LogEvent[]) => void;

const clientLogs: LogEvent[] = [];
const listeners = new Set<ClientLogListener>();

interface ClientLogInput {
  level?: LogLevel;
  scope: string;
  event: string;
  operationId?: string;
  requestId?: string;
  durationMs?: number;
  metadata?: LogMetadata;
}

export function clientLog(input: ClientLogInput): LogEvent {
  const event: LogEvent = {
    id: createLogId("cli"),
    timestamp: nowIso(),
    level: input.level ?? "info",
    scope: input.scope,
    event: input.event,
    operationId: input.operationId,
    requestId: input.requestId,
    durationMs: input.durationMs,
    metadata: sanitizeMetadata(input.metadata),
  };

  clientLogs.unshift(event);

  if (clientLogs.length > MAX_CLIENT_LOGS) {
    clientLogs.length = MAX_CLIENT_LOGS;
  }

  writeConsole(event);
  emit();

  return event;
}

export function clientLogError(
  input: Omit<ClientLogInput, "level" | "metadata"> & {
    error: unknown;
    metadata?: LogMetadata;
  },
): LogEvent {
  return clientLog({
    ...input,
    level: "error",
    metadata: {
      ...input.metadata,
      serializedError: serializeError(input.error),
    },
  });
}

export function subscribeClientLogs(listener: ClientLogListener): () => void {
  listeners.add(listener);
  listener([...clientLogs]);

  return () => {
    listeners.delete(listener);
  };
}

export function getClientLogs(): LogEvent[] {
  return [...clientLogs];
}

function emit(): void {
  const snapshot = [...clientLogs];

  for (const listener of listeners) {
    listener(snapshot);
  }
}

function writeConsole(event: LogEvent): void {
  const label = `[${event.scope}] ${event.event}`;

  switch (event.level) {
    case "debug":
      console.debug(label, event);
      break;
    case "warn":
      console.warn(label, event);
      break;
    case "error":
      // Next.js dev overlay treats browser console.error calls as runtime errors.
      // These events are handled app diagnostics, so keep severity in the payload
      // and avoid turning expected local Nano outages into overlay crashes.
      console.warn(label, event);
      break;
    default:
      console.info(label, event);
      break;
  }
}
