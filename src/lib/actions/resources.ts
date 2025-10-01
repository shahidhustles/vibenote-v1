"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";

/**
 * Creates a new resource and generates embeddings for it
 * @param input - The resource content and userId
 * @returns Success message or error
 */
export const createResource = async (input: NewResourceParams) => {
  try {
    const { content, userId } = insertResourceSchema.parse(input);

    // Create the resource
    const [resource] = await db
      .insert(resources)
      .values({ content, userId })
      .returning();

    // Generate embeddings for the content
    const embeddings = await generateEmbeddings(content);

    // Insert embeddings into database
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        userId: userId,
        ...embedding,
      }))
    );

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
