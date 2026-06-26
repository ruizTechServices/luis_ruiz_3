export interface OllamaConfig {
  baseUrl: string;
  chatModel: string;
  embedModel: string;
  embeddingProfileId: string;
}

export function getOllamaConfig(): OllamaConfig {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://100.86.175.53:11435",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "qwen3:1.7b",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:0.6b",
    embeddingProfileId:
      process.env.EMBEDDING_PROFILE_ID ?? "qwen3-embedding-0.6b-v1",
  };
}
