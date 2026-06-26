import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type {
  ChatMessageRecord,
  ConversationRecord,
  MemoryRecord,
} from "@/lib/ai/contracts";

const DATABASE_NAME = "nano-rag-chat";
const DATABASE_VERSION = 1;

interface NanoChatDatabase extends DBSchema {
  conversations: {
    key: string;
    value: ConversationRecord;
    indexes: {
      "by-updated-at": number;
    };
  };
  messages: {
    key: string;
    value: ChatMessageRecord;
    indexes: {
      "by-conversation-created-at": [string, number];
    };
  };
  memories: {
    key: string;
    value: MemoryRecord;
    indexes: {
      "by-conversation-created-at": [string, number];
      "by-conversation-normalized-text": [string, string];
      "by-conversation-profile": [string, string];
    };
  };
}

let databasePromise: Promise<IDBPDatabase<NanoChatDatabase>> | null = null;

export function getChatDatabase(): Promise<IDBPDatabase<NanoChatDatabase>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB can only be opened in the browser.");
  }

  databasePromise ??= openDB<NanoChatDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains("conversations")) {
          const store = database.createObjectStore("conversations", {
            keyPath: "id",
          });

          store.createIndex("by-updated-at", "updatedAt");
        }

        if (!database.objectStoreNames.contains("messages")) {
          const store = database.createObjectStore("messages", {
            keyPath: "id",
          });

          store.createIndex("by-conversation-created-at", [
            "conversationId",
            "createdAt",
          ]);
        }

        if (!database.objectStoreNames.contains("memories")) {
          const store = database.createObjectStore("memories", {
            keyPath: "id",
          });

          store.createIndex("by-conversation-created-at", [
            "conversationId",
            "createdAt",
          ]);
          store.createIndex("by-conversation-normalized-text", [
            "conversationId",
            "normalizedUserText",
          ]);
          store.createIndex("by-conversation-profile", [
            "conversationId",
            "embeddingProfileId",
          ]);
        }
      },
      terminated() {
        databasePromise = null;
      },
    },
  );

  return databasePromise;
}
