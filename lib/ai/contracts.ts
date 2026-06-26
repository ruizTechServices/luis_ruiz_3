export type ChatRole = "user" | "assistant";

export type AssistantSource = "model" | "exact-cache" | "error";

export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  source?: AssistantSource;
  similarity?: number;
  matchedMemoryId?: string;
}

export interface MemoryRecord {
  id: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  userText: string;
  normalizedUserText: string;
  assistantText: string;
  embedding: Float32Array;
  embeddingModel: string;
  embeddingProfileId: string;
  embeddingDimensions: number;
  createdAt: number;
}

export interface RetrievedMemory {
  id: string;
  userText: string;
  assistantText: string;
  similarity: number;
}

export interface EmbeddingApiResponse {
  model: string;
  profileId: string;
  dimensions: number;
  embedding: number[];
}

export interface ChatApiRequest {
  messages: ChatMessageRecord[];
  memories: RetrievedMemory[];
}

export interface ChatApiResponse {
  answer: string;
}

export type EmbeddingApiEnvelope = ApiEnvelope<EmbeddingApiResponse>;

export type ChatResponseEnvelope = ApiEnvelope<ChatApiResponse>;
import type { ApiEnvelope } from "@/lib/api/envelope";
