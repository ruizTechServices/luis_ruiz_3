"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { safeJson } from "@/lib/api/safe-json";
import type {
  ChatMessageRecord,
  ChatResponseEnvelope,
  EmbeddingApiEnvelope,
  MemoryRecord,
  RetrievedMemory,
} from "@/lib/ai/contracts";
import {
  checkPersistentStorage,
  clearConversation,
  countMemories,
  DEFAULT_CONVERSATION_ID,
  ensureConversation,
  findExactMemory,
  listCompatibleMemories,
  listRecentMessages,
  normalizeSearchText,
  pruneMemories,
  requestPersistentStorage,
  saveAssistantAndMemory,
  saveAssistantMessage,
  saveUserMessage,
} from "@/lib/browser-db/repository";
import {
  clientLog,
  clientLogError,
  subscribeClientLogs,
} from "@/lib/logging/client";
import {
  createOperationId,
  startTimer,
  type LogEvent,
} from "@/lib/logging/shared";
import { rankMemories } from "@/lib/similarity";
import {
  PortfolioCard,
  PortfolioCardContent,
  PortfolioCardDescription,
  PortfolioCardHeader,
  PortfolioCardTitle,
} from "@/components/home/portfolio-card";

const MAX_DISPLAYED_MESSAGES = 80;
const MAX_MODEL_HISTORY_MESSAGES = 12;
const MAX_STORED_MEMORIES = 500;
const RETRIEVAL_LIMIT = 3;
const RETRIEVAL_THRESHOLD = 0.72;

interface ClosestMatchState {
  userText: string;
  similarity: number;
  wasUsed: boolean;
}

type StorageDurability = "checking" | "persistent" | "best-effort" | "unsupported";

type NanoHealthStatus = "checking" | "online" | "offline";

interface EmbeddingResult {
  model: string;
  profileId: string;
  dimensions: number;
  vector: Float32Array;
}

interface NanoHealthState {
  status: NanoHealthStatus;
  version?: string | null;
  message?: string;
  requestId?: string;
}

type HealthApiEnvelope =
  | {
      ok: true;
      requestId: string;
      online: true;
      version: string | null;
    }
  | {
      ok: false;
      requestId: string;
      online: false;
      version: null;
      error: {
        code: string;
        message: string;
        status: number;
        retryable: boolean;
      };
    };

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly requestId?: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function OrinNanoChatCard() {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [input, setInput] = useState("");
  const [memoryCount, setMemoryCount] = useState(0);
  const [storageDurability, setStorageDurability] =
    useState<StorageDurability>("checking");
  const [nanoHealth, setNanoHealth] = useState<NanoHealthState>({
    status: "checking",
  });
  const [closestMatch, setClosestMatch] = useState<ClosestMatchState | null>(
    null,
  );
  const [logEvents, setLogEvents] = useState<LogEvent[]>([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshFromDatabase = useCallback(async (operationId?: string) => {
    const duration = startTimer();
    const [storedMessages, storedMemoryCount] = await Promise.all([
      listRecentMessages(DEFAULT_CONVERSATION_ID, MAX_DISPLAYED_MESSAGES),
      countMemories(DEFAULT_CONVERSATION_ID),
    ]);

    setMessages(storedMessages);
    setMemoryCount(storedMemoryCount);

    clientLog({
      scope: "orin.chat.db",
      event: "refresh_completed",
      operationId,
      durationMs: duration(),
      metadata: {
        messageCount: storedMessages.length,
        memoryCount: storedMemoryCount,
      },
    });
  }, []);

  useEffect(() => subscribeClientLogs(setLogEvents), []);

  useEffect(() => {
    let cancelled = false;
    const operationId = createOperationId("init");
    const duration = startTimer();

    async function initialize() {
      clientLog({
        scope: "orin.chat.lifecycle",
        event: "initialize_started",
        operationId,
      });

      try {
        await ensureConversation(DEFAULT_CONVERSATION_ID);

        const durability = await ensurePersistentStorage(operationId);

        if (!cancelled) {
          setStorageDurability(durability);
        }

        const health = await checkNanoHealth(operationId);

        if (!cancelled) {
          setNanoHealth(health);
        }

        await refreshFromDatabase(operationId);

        if (!cancelled) {
          setIsReady(true);
        }

        clientLog({
          scope: "orin.chat.lifecycle",
          event: "initialize_succeeded",
          operationId,
          durationMs: duration(),
          metadata: {
            storageDurability: durability,
          },
        });
      } catch (initializationError) {
        clientLogError({
          scope: "orin.chat.lifecycle",
          event: "initialize_failed",
          operationId,
          durationMs: duration(),
          error: initializationError,
        });

        if (!cancelled) {
          setError(getErrorMessage(initializationError));
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [refreshFromDatabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userText = input.trim();

    if (!userText || !isReady || isSubmitting) {
      return;
    }

    const operationId = createOperationId("chatflow");
    const duration = startTimer();

    clientLog({
      scope: "orin.chat.submit",
      event: "submit_started",
      operationId,
      metadata: {
        inputLength: userText.length,
      },
    });

    setError(null);
    setClosestMatch(null);
    setIsSubmitting(true);

    try {
      const health = await checkNanoHealth(operationId);
      setNanoHealth(health);

      if (health.status === "offline") {
        clientLog({
          level: "warn",
          scope: "orin.chat.submit",
          event: "submit_blocked_nano_offline",
          operationId,
          requestId: health.requestId,
          durationMs: duration(),
        });

        return;
      }

      setInput("");

      const userMessage: ChatMessageRecord = {
        id: createId(),
        conversationId: DEFAULT_CONVERSATION_ID,
        role: "user",
        content: userText,
        createdAt: Date.now(),
      };

      await saveUserMessage(userMessage);
      clientLog({
        scope: "orin.chat.db",
        event: "user_message_saved",
        operationId,
      });
      await refreshFromDatabase(operationId);

      const embeddingResult = await requestEmbedding(userText, operationId);
      const normalizedUserText = normalizeSearchText(userText);
      const exactMemory = await findExactMemory(
        DEFAULT_CONVERSATION_ID,
        normalizedUserText,
        embeddingResult.profileId,
        embeddingResult.dimensions,
      );

      clientLog({
        scope: "orin.chat.memory",
        event: "exact_cache_checked",
        operationId,
        metadata: {
          exactCacheHit: Boolean(exactMemory),
        },
      });

      if (exactMemory) {
        const assistantMessage: ChatMessageRecord = {
          id: createId(),
          conversationId: DEFAULT_CONVERSATION_ID,
          role: "assistant",
          content: exactMemory.assistantText,
          createdAt: Date.now(),
          source: "exact-cache",
          similarity: 1,
          matchedMemoryId: exactMemory.id,
        };

        await saveAssistantMessage(assistantMessage);

        setClosestMatch({
          userText: exactMemory.userText,
          similarity: 1,
          wasUsed: true,
        });

        await refreshFromDatabase(operationId);

        clientLog({
          scope: "orin.chat.submit",
          event: "submit_succeeded",
          operationId,
          durationMs: duration(),
          metadata: {
            source: "exact-cache",
          },
        });
        return;
      }

      const compatibleMemories = await listCompatibleMemories(
        DEFAULT_CONVERSATION_ID,
        embeddingResult.profileId,
        embeddingResult.dimensions,
      );
      const rankedMemories = rankMemories(
        embeddingResult.vector,
        compatibleMemories,
        RETRIEVAL_LIMIT,
      );
      const relevantMemories = rankedMemories.filter(
        (memory) => memory.similarity >= RETRIEVAL_THRESHOLD,
      );

      clientLog({
        scope: "orin.chat.memory",
        event: "semantic_retrieval_completed",
        operationId,
        metadata: {
          compatibleMemoryCount: compatibleMemories.length,
          rankedMemoryCount: rankedMemories.length,
          retrievedMemoryCount: relevantMemories.length,
          topSimilarity: rankedMemories[0]?.similarity,
        },
      });

      if (rankedMemories[0]) {
        setClosestMatch({
          userText: rankedMemories[0].userText,
          similarity: rankedMemories[0].similarity,
          wasUsed: relevantMemories.some(
            (memory) => memory.id === rankedMemories[0]?.id,
          ),
        });
      }

      const recentMessages = await listRecentMessages(
        DEFAULT_CONVERSATION_ID,
        MAX_MODEL_HISTORY_MESSAGES,
      );
      const answer = await requestChat(recentMessages, relevantMemories, operationId);
      const assistantMessage: ChatMessageRecord = {
        id: createId(),
        conversationId: DEFAULT_CONVERSATION_ID,
        role: "assistant",
        content: answer,
        createdAt: Date.now(),
        source: "model",
        similarity: rankedMemories[0]?.similarity,
        matchedMemoryId: relevantMemories[0]?.id,
      };
      const memory: MemoryRecord = {
        id: createId(),
        conversationId: DEFAULT_CONVERSATION_ID,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        userText,
        normalizedUserText,
        assistantText: answer,
        embedding: embeddingResult.vector,
        embeddingModel: embeddingResult.model,
        embeddingProfileId: embeddingResult.profileId,
        embeddingDimensions: embeddingResult.dimensions,
        createdAt: assistantMessage.createdAt,
      };

      await saveAssistantAndMemory(assistantMessage, memory);
      await pruneMemories(DEFAULT_CONVERSATION_ID, MAX_STORED_MEMORIES);
      await refreshFromDatabase(operationId);

      clientLog({
        scope: "orin.chat.submit",
        event: "submit_succeeded",
        operationId,
        durationMs: duration(),
        metadata: {
          source: "model",
          retrievedMemoryCount: relevantMemories.length,
        },
      });
    } catch (submissionError) {
      clientLogError({
        scope: "orin.chat.submit",
        event: "submit_failed",
        operationId,
        durationMs: duration(),
        error: submissionError,
      });
      setError(getErrorMessage(submissionError));
      await refreshFromDatabase(operationId);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClear() {
    if (isSubmitting) {
      return;
    }

    const operationId = createOperationId("clear");
    const duration = startTimer();

    clientLog({
      scope: "orin.chat.clear",
      event: "clear_started",
      operationId,
    });

    setError(null);
    setClosestMatch(null);

    try {
      await clearConversation(DEFAULT_CONVERSATION_ID);
      await refreshFromDatabase(operationId);

      clientLog({
        scope: "orin.chat.clear",
        event: "clear_succeeded",
        operationId,
        durationMs: duration(),
      });
    } catch (clearError) {
      clientLogError({
        scope: "orin.chat.clear",
        event: "clear_failed",
        operationId,
        durationMs: duration(),
        error: clearError,
      });
      setError(getErrorMessage(clearError));
    }
  }

  async function handleCheckNanoHealth() {
    if (isSubmitting) {
      return;
    }

    const operationId = createOperationId("health");

    setError(null);
    setNanoHealth({
      status: "checking",
    });

    const health = await checkNanoHealth(operationId);
    setNanoHealth(health);
  }

  return (
    <PortfolioCard className="mt-10 flex min-h-[680px] max-w-3xl flex-col p-0">
      <PortfolioCardHeader className="border-b p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <PortfolioCardTitle>Orin Nano Memory Chat</PortfolioCardTitle>
            <PortfolioCardDescription>
              Local chat with IndexedDB memory, embedding retrieval, and a
              Next.js proxy to the Nano.
            </PortfolioCardDescription>
            <p className="mt-2 text-xs text-muted-foreground">
              {memoryCount} searchable memories - Storage: {storageDurability}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nano: {formatNanoStatus(nanoHealth)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={!isReady || isSubmitting}
            className="h-9 shrink-0 rounded-md border bg-background px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear history
          </button>
        </div>
      </PortfolioCardHeader>

      {closestMatch ? (
        <aside className="border-b bg-muted/50 px-5 py-3 text-sm">
          <p className="font-medium">Closest memory</p>
          <p className="mt-1 line-clamp-2 text-muted-foreground">
            {closestMatch.userText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Similarity {closestMatch.similarity.toFixed(4)} -{" "}
            {closestMatch.wasUsed ? "used as context" : "below threshold"}
          </p>
        </aside>
      ) : null}

      {nanoHealth.status === "offline" ? (
        <div
          role="status"
          className="flex flex-col gap-3 border-b border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200"
        >
          <span>{formatNanoOfflineMessage(nanoHealth)}</span>
          <button
            type="button"
            onClick={() => void handleCheckNanoHealth()}
            disabled={isSubmitting}
            className="h-8 shrink-0 rounded-md border border-amber-500/40 bg-background px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Check again
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <PortfolioCardContent className="mt-0 flex flex-1 flex-col p-0">
        <div
          aria-live="polite"
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        >
          {!isReady ? (
            <p className="text-sm text-muted-foreground">
              Opening local database...
            </p>
          ) : null}

          {isReady && messages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Send the first message to create the first searchable local
              memory.
            </div>
          ) : null}

          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-sm text-primary-foreground"
                  : "mr-auto max-w-[85%] rounded-lg bg-muted p-3 text-sm"
              }
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {message.role === "assistant" && message.source ? (
                <p className="mt-2 text-xs opacity-70">
                  Source: {message.source}
                  {typeof message.similarity === "number"
                    ? ` - nearest memory ${message.similarity.toFixed(4)}`
                    : ""}
                </p>
              ) : null}
            </article>
          ))}

          {isSubmitting ? (
            <div className="mr-auto rounded-lg bg-muted p-3 text-sm">
              Embedding message, searching memory, and contacting Nano...
            </div>
          ) : null}
        </div>

        <DiagnosticsPanel
          events={logEvents}
          isOpen={isDiagnosticsOpen}
          onToggle={() => setIsDiagnosticsOpen((current) => !current)}
        />

        <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
          <label htmlFor="orin-chat-input" className="sr-only">
            Message
          </label>
          <input
            id="orin-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!isReady || isSubmitting}
            placeholder="Ask the local Nano..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              !isReady ||
              isSubmitting ||
              !input.trim() ||
              nanoHealth.status !== "online"
            }
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </PortfolioCardContent>
    </PortfolioCard>
  );
}

function DiagnosticsPanel({
  events,
  isOpen,
  onToggle,
}: {
  events: LogEvent[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="border-t bg-muted/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium"
      >
        <span>Diagnostics</span>
        <span className="text-muted-foreground">
          {events.length} events {isOpen ? "hide" : "show"}
        </span>
      </button>

      {isOpen ? (
        <div className="max-h-48 overflow-y-auto border-t px-4 py-3">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events yet.</p>
          ) : (
            <ol className="space-y-2">
              {events.slice(0, 40).map((event) => (
                <li
                  key={event.id}
                  className="rounded-md border bg-background p-2 font-mono text-[11px] leading-5"
                >
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>{formatTime(event.timestamp)}</span>
                    <span>{event.level}</span>
                    <span>{event.scope}</span>
                    <span>{event.event}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                    {event.operationId ? <span>op={event.operationId}</span> : null}
                    {event.requestId ? <span>req={event.requestId}</span> : null}
                    {typeof event.durationMs === "number" ? (
                      <span>{event.durationMs}ms</span>
                    ) : null}
                    {event.metadata ? (
                      <span>{formatMetadata(event.metadata)}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}

function createId(): string {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return `${error.message} Request: ${error.requestId ?? "unknown"}`;
  }

  return error instanceof Error ? error.message : "An unknown error occurred.";
}

async function ensurePersistentStorage(
  operationId: string,
): Promise<StorageDurability> {
  const duration = startTimer();
  const persisted = await checkPersistentStorage();

  if (persisted === null) {
    clientLog({
      scope: "orin.chat.storage",
      event: "persistence_unsupported",
      operationId,
      durationMs: duration(),
    });
    return "unsupported";
  }

  if (persisted) {
    clientLog({
      scope: "orin.chat.storage",
      event: "persistence_already_granted",
      operationId,
      durationMs: duration(),
    });
    return "persistent";
  }

  const granted = await requestPersistentStorage();
  const durability =
    granted === null ? "unsupported" : granted ? "persistent" : "best-effort";

  clientLog({
    scope: "orin.chat.storage",
    event: "persistence_requested",
    operationId,
    durationMs: duration(),
    metadata: {
      storageDurability: durability,
    },
  });

  return durability;
}

async function checkNanoHealth(operationId: string): Promise<NanoHealthState> {
  const duration = startTimer();

  clientLog({
    scope: "orin.chat.health",
    event: "health_check_started",
    operationId,
  });

  try {
    const response = await fetch("/api/ai/health", {
      method: "GET",
      headers: {
        "x-operation-id": operationId,
      },
    });
    const result = await safeJson<HealthApiEnvelope>(response);

    if (!result.ok) {
      clientLog({
        level: "error",
        scope: "orin.chat.health",
        event: "health_invalid_json",
        operationId,
        durationMs: duration(),
        metadata: {
          status: response.status,
          rawBodyLength: result.rawText.length,
        },
      });

      return {
        status: "offline",
        message: "Nano health check returned an invalid API response.",
      };
    }

    if (!result.data.ok) {
      clientLog({
        level: "warn",
        scope: "orin.chat.health",
        event: "health_check_failed",
        operationId,
        requestId: result.data.requestId,
        durationMs: duration(),
        metadata: {
          code: result.data.error.code,
          status: result.data.error.status,
          retryable: result.data.error.retryable,
        },
      });

      return {
        status: "offline",
        message: result.data.error.message,
        requestId: result.data.requestId,
      };
    }

    clientLog({
      scope: "orin.chat.health",
      event: "health_check_succeeded",
      operationId,
      requestId: result.data.requestId,
      durationMs: duration(),
      metadata: {
        hasVersion: Boolean(result.data.version),
      },
    });

    return {
      status: "online",
      version: result.data.version,
      requestId: result.data.requestId,
    };
  } catch (healthError) {
    clientLogError({
      scope: "orin.chat.health",
      event: "health_check_fetch_failed",
      operationId,
      durationMs: duration(),
      error: healthError,
    });

    return {
      status: "offline",
      message: "Nano health check could not reach the local API route.",
    };
  }
}

async function requestEmbedding(
  input: string,
  operationId: string,
): Promise<EmbeddingResult> {
  const duration = startTimer();

  clientLog({
    scope: "orin.chat.api",
    event: "embed_request_started",
    operationId,
    metadata: {
      inputLength: input.length,
    },
  });

  const response = await fetch("/api/ai/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operation-id": operationId,
    },
    body: JSON.stringify({ input }),
  });
  const result = await safeJson<EmbeddingApiEnvelope>(response);

  if (!result.ok) {
    clientLog({
      level: "error",
      scope: "orin.chat.api",
      event: "embed_invalid_json",
      operationId,
      durationMs: duration(),
      metadata: {
        status: response.status,
        rawBodyLength: result.rawText.length,
      },
    });
    throw new ApiRequestError(
      "Embedding failed: API returned an invalid JSON response.",
      "API_INVALID_JSON",
      response.status,
    );
  }

  if (!result.data.ok) {
    clientLog({
      level: "error",
      scope: "orin.chat.api",
      event: "embed_request_failed",
      operationId,
      requestId: result.data.requestId,
      durationMs: duration(),
      metadata: {
        code: result.data.error.code,
        status: result.data.error.status,
        retryable: result.data.error.retryable,
      },
    });
    throw new ApiRequestError(
      `Embedding failed: ${result.data.error.message}`,
      result.data.error.code,
      result.data.error.status,
      result.data.requestId,
      result.data.error.retryable,
    );
  }

  if (
    !result.data.embedding?.length ||
    !result.data.model ||
    !result.data.profileId
  ) {
    throw new ApiRequestError(
      "Embedding failed: API response was incomplete.",
      "API_INCOMPLETE_RESPONSE",
      response.status,
      result.data.requestId,
      true,
    );
  }

  clientLog({
    scope: "orin.chat.api",
    event: "embed_request_succeeded",
    operationId,
    requestId: result.data.requestId,
    durationMs: duration(),
    metadata: {
      dimensions: result.data.dimensions,
      model: result.data.model,
    },
  });

  return {
    model: result.data.model,
    profileId: result.data.profileId,
    dimensions: result.data.dimensions ?? result.data.embedding.length,
    vector: new Float32Array(result.data.embedding),
  };
}

async function requestChat(
  messages: ChatMessageRecord[],
  memories: RetrievedMemory[],
  operationId: string,
): Promise<string> {
  const duration = startTimer();

  clientLog({
    scope: "orin.chat.api",
    event: "chat_request_started",
    operationId,
    metadata: {
      messageCount: messages.length,
      retrievedMemoryCount: memories.length,
    },
  });

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operation-id": operationId,
    },
    body: JSON.stringify({ messages, memories }),
  });
  const result = await safeJson<ChatResponseEnvelope>(response);

  if (!result.ok) {
    clientLog({
      level: "error",
      scope: "orin.chat.api",
      event: "chat_invalid_json",
      operationId,
      durationMs: duration(),
      metadata: {
        status: response.status,
        rawBodyLength: result.rawText.length,
      },
    });
    throw new ApiRequestError(
      "Chat failed: API returned an invalid JSON response.",
      "API_INVALID_JSON",
      response.status,
    );
  }

  if (!result.data.ok) {
    clientLog({
      level: "error",
      scope: "orin.chat.api",
      event: "chat_request_failed",
      operationId,
      requestId: result.data.requestId,
      durationMs: duration(),
      metadata: {
        code: result.data.error.code,
        status: result.data.error.status,
        retryable: result.data.error.retryable,
      },
    });
    throw new ApiRequestError(
      `Chat failed: ${result.data.error.message}`,
      result.data.error.code,
      result.data.error.status,
      result.data.requestId,
      result.data.error.retryable,
    );
  }

  if (!result.data.answer) {
    throw new ApiRequestError(
      "Chat failed: API response was empty.",
      "API_EMPTY_RESPONSE",
      response.status,
      result.data.requestId,
      true,
    );
  }

  clientLog({
    scope: "orin.chat.api",
    event: "chat_request_succeeded",
    operationId,
    requestId: result.data.requestId,
    durationMs: duration(),
    metadata: {
      answerLength: result.data.answer.length,
    },
  });

  return result.data.answer;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

function formatNanoStatus(health: NanoHealthState): string {
  if (health.status === "online") {
    return health.version ? `online (${health.version})` : "online";
  }

  return health.status;
}

function formatNanoOfflineMessage(health: NanoHealthState): string {
  const requestSuffix = health.requestId ? ` Request: ${health.requestId}` : "";

  return `Nano is offline. Check Tailscale, Docker, and ollama-gpu.${requestSuffix}`;
}

function formatMetadata(metadata: Record<string, unknown>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `${key}=${formatMetadataValue(value)}`)
    .join(" ");
}

function formatMetadataValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
