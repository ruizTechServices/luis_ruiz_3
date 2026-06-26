import type {
  ChatMessageRecord,
  ConversationRecord,
  MemoryRecord,
} from "@/lib/ai/contracts";
import { getChatDatabase } from "@/lib/browser-db/database";

export const DEFAULT_CONVERSATION_ID = "default-conversation";

export function normalizeSearchText(text: string): string {
  return text.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function ensureConversation(
  conversationId = DEFAULT_CONVERSATION_ID,
): Promise<ConversationRecord> {
  const database = await getChatDatabase();
  const existing = await database.get("conversations", conversationId);

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const conversation: ConversationRecord = {
    id: conversationId,
    title: "Orin Nano Memory Chat",
    createdAt: now,
    updatedAt: now,
  };

  await database.put("conversations", conversation);

  return conversation;
}

export async function saveUserMessage(
  message: ChatMessageRecord,
): Promise<void> {
  await saveMessage(message);
}

export async function saveAssistantMessage(
  message: ChatMessageRecord,
): Promise<void> {
  await saveMessage(message);
}

async function saveMessage(message: ChatMessageRecord): Promise<void> {
  const database = await getChatDatabase();
  const transaction = database.transaction(
    ["messages", "conversations"],
    "readwrite",
  );

  await transaction.objectStore("messages").put(message);

  const conversations = transaction.objectStore("conversations");
  const conversation = await conversations.get(message.conversationId);

  if (conversation) {
    await conversations.put({
      ...conversation,
      updatedAt: message.createdAt,
    });
  }

  await transaction.done;
}

export async function saveAssistantAndMemory(
  assistantMessage: ChatMessageRecord,
  memory: MemoryRecord,
): Promise<void> {
  const database = await getChatDatabase();
  const transaction = database.transaction(
    ["messages", "memories", "conversations"],
    "readwrite",
  );

  await transaction.objectStore("messages").put(assistantMessage);
  await transaction.objectStore("memories").put(memory);

  const conversations = transaction.objectStore("conversations");
  const conversation = await conversations.get(assistantMessage.conversationId);

  if (conversation) {
    await conversations.put({
      ...conversation,
      updatedAt: assistantMessage.createdAt,
    });
  }

  await transaction.done;
}

export async function listRecentMessages(
  conversationId: string,
  limit = 100,
): Promise<ChatMessageRecord[]> {
  const database = await getChatDatabase();
  const transaction = database.transaction("messages", "readonly");
  const index = transaction.store.index("by-conversation-created-at");
  const range = IDBKeyRange.bound(
    [conversationId, 0],
    [conversationId, Number.MAX_SAFE_INTEGER],
  );
  const messages: ChatMessageRecord[] = [];
  let cursor = await index.openCursor(range, "prev");

  while (cursor && messages.length < limit) {
    messages.push(cursor.value);
    cursor = await cursor.continue();
  }

  await transaction.done;

  return messages.reverse();
}

export async function countMemories(conversationId: string): Promise<number> {
  const database = await getChatDatabase();
  const transaction = database.transaction("memories", "readonly");
  const index = transaction.store.index("by-conversation-created-at");
  const range = IDBKeyRange.bound(
    [conversationId, 0],
    [conversationId, Number.MAX_SAFE_INTEGER],
  );
  const count = await index.count(range);

  await transaction.done;

  return count;
}

export async function listCompatibleMemories(
  conversationId: string,
  embeddingProfileId: string,
  dimensions: number,
): Promise<MemoryRecord[]> {
  const database = await getChatDatabase();
  const memories = await database.getAllFromIndex(
    "memories",
    "by-conversation-profile",
    IDBKeyRange.only([conversationId, embeddingProfileId]),
  );

  return memories.filter(
    (memory) =>
      memory.embeddingDimensions === dimensions &&
      memory.embedding.length === dimensions,
  );
}

export async function findExactMemory(
  conversationId: string,
  normalizedText: string,
  embeddingProfileId: string,
  dimensions: number,
): Promise<MemoryRecord | null> {
  const database = await getChatDatabase();
  const matches = await database.getAllFromIndex(
    "memories",
    "by-conversation-normalized-text",
    IDBKeyRange.only([conversationId, normalizedText]),
  );

  return (
    matches.find(
      (memory) =>
        memory.embeddingProfileId === embeddingProfileId &&
        memory.embeddingDimensions === dimensions &&
        memory.embedding.length === dimensions,
    ) ?? null
  );
}

export async function pruneMemories(
  conversationId: string,
  maximumMemories = 500,
): Promise<void> {
  const database = await getChatDatabase();
  const transaction = database.transaction("memories", "readwrite");
  const index = transaction.store.index("by-conversation-created-at");
  const range = IDBKeyRange.bound(
    [conversationId, 0],
    [conversationId, Number.MAX_SAFE_INTEGER],
  );
  const total = await index.count(range);
  let remainingToDelete = total - maximumMemories;

  if (remainingToDelete <= 0) {
    await transaction.done;
    return;
  }

  let cursor = await index.openCursor(range, "next");

  while (cursor && remainingToDelete > 0) {
    await cursor.delete();
    remainingToDelete -= 1;
    cursor = await cursor.continue();
  }

  await transaction.done;
}

export async function clearConversation(conversationId: string): Promise<void> {
  const database = await getChatDatabase();
  const transaction = database.transaction(
    ["messages", "memories", "conversations"],
    "readwrite",
  );
  const range = IDBKeyRange.bound(
    [conversationId, 0],
    [conversationId, Number.MAX_SAFE_INTEGER],
  );

  const messageIndex = transaction
    .objectStore("messages")
    .index("by-conversation-created-at");
  let messageCursor = await messageIndex.openCursor(range);

  while (messageCursor) {
    await messageCursor.delete();
    messageCursor = await messageCursor.continue();
  }

  const memoryIndex = transaction
    .objectStore("memories")
    .index("by-conversation-created-at");
  let memoryCursor = await memoryIndex.openCursor(range);

  while (memoryCursor) {
    await memoryCursor.delete();
    memoryCursor = await memoryCursor.continue();
  }

  const conversations = transaction.objectStore("conversations");
  const conversation = await conversations.get(conversationId);

  if (conversation) {
    await conversations.put({
      ...conversation,
      updatedAt: Date.now(),
    });
  }

  await transaction.done;
}

export async function checkPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) {
    return null;
  }

  return navigator.storage.persisted();
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return null;
  }

  return navigator.storage.persist();
}
