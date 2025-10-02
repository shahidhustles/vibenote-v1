/**
 * Action to retrieve context and images from Morphik AI server
 * using document retrieval with ColPali
 */

export interface MorphikImageContent {
  chunk_number: number;
  content_type: "image";
  context: string;
  document_id: string;
  download_url: string;
  filename: string;
  image_url: string;
  metadata: string;
  score: number;
}

export interface MorphikTextContent {
  content: string;
  content_type: "text";
  chunk_number?: number;
  document_id?: string;
  score?: number;
}

export interface MorphikRetrievalResponse {
  image_content: MorphikImageContent[];
  text_content: MorphikTextContent[];
}

export interface MorphikRetrievalError {
  error: string;
  details?: string;
}

// The Morphik API server URL
const MORPHIK_API_BASE = process.env.MORPHIK_API_URL || "http://localhost:5001";

/**
 * Retrieve relevant context and images from ingested documents
 */
export async function retrieveFromMorphik(
  query: string,
  userId: string
): Promise<MorphikRetrievalResponse> {
  try {
    const response = await fetch(`${MORPHIK_API_BASE}/api/v1/retrieval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MorphikRetrievalResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error retrieving from Morphik:", error);
    throw {
      error: "Failed to retrieve context from Morphik",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extract combined context text from Morphik response for AI
 */
export function extractContextText(response: MorphikRetrievalResponse): string {
  const imageContexts = response.image_content.map((img) => img.context);
  const textContents = response.text_content.map((text) => text.content);

  const allContext = [...imageContexts, ...textContents].filter(Boolean);

  if (allContext.length === 0) {
    return "No relevant context found in the documents.";
  }

  return allContext.join("\n\n---\n\n");
}

/**
 * Extract image URLs from Morphik response
 */
export function extractImageUrls(response: MorphikRetrievalResponse): string[] {
  return response.image_content.map((img) => img.image_url);
}

/**
 * Retrieve from Morphik AND immediately save to Convex
 * This ensures images are available in realtime
 */
export async function retrieveAndSaveToConvex(
  query: string,
  userId: string,
  chatId: string
): Promise<{
  context: string;
  imageUrls: string[];
  imageCount: number;
  textChunkCount: number;
}> {
  try {
    // Retrieve from Morphik API
    const morphikResponse = await retrieveFromMorphik(query, userId);

    // Extract context and images
    const contextText = extractContextText(morphikResponse);
    const imageUrls = extractImageUrls(morphikResponse);

    // Save to Convex immediately
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      try {
        const saveResponse = await fetch(
          `${convexUrl.replace("/api", "")}/api/mutation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: "chat:saveMorphikRetrieval",
              args: {
                chatId,
                userId,
                query,
                imageUrls,
                context: contextText,
                imageCount: morphikResponse.image_content.length,
                textChunkCount: morphikResponse.text_content.length,
              },
              format: "json",
            }),
          }
        );

        if (saveResponse.ok) {
          console.log("[retrieveAndSaveToConvex] Saved to Convex successfully");
        } else {
          console.error(
            "[retrieveAndSaveToConvex] Failed to save to Convex:",
            await saveResponse.text()
          );
        }
      } catch (convexError) {
        console.error(
          "[retrieveAndSaveToConvex] Error saving to Convex:",
          convexError
        );
        // Don't throw - still return the data for AI to use
      }
    }

    // Return data for AI to use
    return {
      context: contextText,
      imageUrls: imageUrls,
      imageCount: morphikResponse.image_content.length,
      textChunkCount: morphikResponse.text_content.length,
    };
  } catch (error) {
    console.error("[retrieveAndSaveToConvex] Error:", error);
    throw error;
  }
}
