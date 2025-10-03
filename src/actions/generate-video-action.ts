"use server";

import { nanoid } from "nanoid";

interface GenerateVideoResponse {
  success: boolean;
  message?: string;
  video_url?: string;
  audio_url?: string;
  thumbnail_url?: string;
  topic?: string;
  explanation_points?: string[];
  transcript?: string;
  error?: string;
}

export interface VideoGenerationState {
  success: boolean;
  videoId?: string;
  error?: string;
  message?: string;
}

/**
 * Server action to generate a video using the Manim server
 * This will be called with useActionState hook
 */
export async function generateVideoAction(
  prevState: VideoGenerationState | null,
  formData: FormData
): Promise<VideoGenerationState> {
  const topic = formData.get("topic") as string;
  const userId = formData.get("userId") as string;

  // Validate inputs
  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      error: "Please enter a topic",
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // Generate unique video ID
  const videoId = nanoid();

  try {
    // Get API URL from environment variable
    const apiUrl =
      process.env.NEXT_PUBLIC_MANIM_API_URL || "http://localhost:5002";

    // Make POST request to Manim server
    const response = await fetch(`${apiUrl}/generate-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic: topic.trim() }),
      // Set timeout to 2 minutes
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Server responded with status ${response.status}`
      );
    }

    const data: GenerateVideoResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to generate video");
    }

    // Return success with video data
    return {
      success: true,
      videoId,
      message: data.message || "Video generated successfully!",
    };
  } catch (error) {
    console.error("Error generating video:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return {
          success: false,
          error:
            "Video generation timed out. Please try again with a simpler topic.",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Helper function to call Manim API directly (for polling or other uses)
 */
export async function callManimAPI(
  topic: string
): Promise<GenerateVideoResponse> {
  const apiUrl =
    process.env.NEXT_PUBLIC_MANIM_API_URL || "http://localhost:5002";

  const response = await fetch(`${apiUrl}/generate-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Server responded with status ${response.status}`
    );
  }

  return await response.json();
}
