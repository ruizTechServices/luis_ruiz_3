import type { MemoryRecord, RetrievedMemory } from "@/lib/ai/contracts";

export function cosineSimilarity(
  vectorA: ArrayLike<number>,
  vectorB: ArrayLike<number>,
): number {
  if (
    vectorA.length === 0 ||
    vectorB.length === 0 ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const valueA = vectorA[index] ?? 0;
    const valueB = vectorB[index] ?? 0;

    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function rankMemories(
  embedding: ArrayLike<number>,
  memories: MemoryRecord[],
  limit: number,
): RetrievedMemory[] {
  return memories
    .map((memory) => ({
      id: memory.id,
      userText: memory.userText,
      assistantText: memory.assistantText,
      similarity: cosineSimilarity(embedding, memory.embedding),
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}
