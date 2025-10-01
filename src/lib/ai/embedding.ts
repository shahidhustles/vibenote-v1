import { CohereClient } from "cohere-ai";
import { db } from "../db";
import { embeddings } from "../db/schema/embeddings";
import { cosineDistance, desc, gt, sql, eq, and } from "drizzle-orm";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

/**
 * Generates chunks from input text by splitting on periods
 * @param input - The text to chunk
 * @returns Array of text chunks
 */
const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i.trim() !== "");
};

/**
 * Generates embeddings for multiple text chunks using Cohere
 * @param value - The text to embed
 * @returns Array of objects containing content and embedding
 */
export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);

  const response = await cohere.embed({
    texts: chunks,
    model: "embed-english-light-v3.0",
    inputType: "search_document",
  });

  const embeddingsArray = Array.isArray(response.embeddings)
    ? response.embeddings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (response.embeddings as any).float || [];

  return embeddingsArray.map((embedding: number[], i: number) => ({
    content: chunks[i],
    embedding: embedding,
  }));
};

/**
 * Generates a single embedding for a query using Cohere
 * @param value - The text to embed
 * @returns Array of numbers representing the embedding
 */
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");

  const response = await cohere.embed({
    texts: [input],
    model: "embed-english-light-v3.0",
    inputType: "search_query",
  });

  const embeddingsArray = Array.isArray(response.embeddings)
    ? response.embeddings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (response.embeddings as any).float || [];

  return embeddingsArray[0] || [];
};

/**
 * Finds relevant content from the knowledge base using semantic search
 * @param userQuery - The user's query
 * @param userId - The user ID to filter results
 * @returns Array of similar content with similarity scores
 */
export const findRelevantContent = async (
  userQuery: string,
  userId: string
) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`;

  const similarGuides = await db
    .select({
      name: embeddings.content,
      similarity,
    })
    .from(embeddings)
    .where(and(eq(embeddings.userId, userId), gt(similarity, 0.5)))
    .orderBy((t) => desc(t.similarity))
    .limit(4);

  return similarGuides;
};
