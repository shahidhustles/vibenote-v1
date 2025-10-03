"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type VideoGenerationState } from "@/actions/generate-video-action";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { callManimAPI } from "@/actions/generate-video-action";

interface VideoGenerationInputProps {
  onGenerationStart?: (topic: string) => void;
  onGenerationComplete?: () => void;
}

export function VideoGenerationInput({
  onGenerationStart,
  onGenerationComplete,
}: VideoGenerationInputProps) {
  const { user } = useUser();
  const formRef = useRef<HTMLFormElement>(null);
  const createVideo = useMutation(api.videos.createVideo);
  const updateVideoStatus = useMutation(api.videos.updateVideoStatus);

  const [state, formAction, isPending] = useActionState<
    VideoGenerationState | null,
    FormData
  >(async (prevState, formData) => {
    const topic = formData.get("topic") as string;

    if (!topic || !user) {
      return {
        success: false,
        error: !user
          ? "Please sign in to generate videos"
          : "Please enter a topic",
      };
    }

    // Generate unique video ID
    const videoId = nanoid();

    try {
      // Notify parent component that generation has started
      onGenerationStart?.(topic);

      // Create video entry in Convex with "generating" status
      await createVideo({
        videoId,
        userId: user.id,
        topic: topic.trim(),
      });

      // Call the Manim API directly
      const response = await callManimAPI(topic.trim());

      if (!response.success) {
        // Update video status to failed
        await updateVideoStatus({
          videoId,
          status: "failed",
          errorMessage: response.error || "Failed to generate video",
        });

        return {
          success: false,
          error: response.error || "Failed to generate video",
        };
      }

      // Update video with completed data
      await updateVideoStatus({
        videoId,
        status: "completed",
        videoUrl: response.video_url,
        thumbnailUrl: response.thumbnail_url || response.video_url,
        audioUrl: response.audio_url,
        explanationPoints: response.explanation_points,
        transcript: response.transcript,
      });

      // Notify parent component that generation is complete
      onGenerationComplete?.();

      return {
        success: true,
        videoId,
        message: response.message || "Video generated successfully!",
      };
    } catch (error) {
      console.error("Error generating video:", error);

      // Update video status to failed
      await updateVideoStatus({
        videoId,
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      });

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  }, null);

  // Show toast notifications based on state changes
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Video generated successfully!");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto p-4">
        <form ref={formRef} action={formAction} className="relative">
          {/* Hidden user ID field */}
          <input type="hidden" name="userId" value={user?.id || ""} />

          <div className="flex gap-2 items-center">
            <Input
              type="text"
              name="topic"
              placeholder="Enter a topic to generate educational video... (e.g., 'Newton's Third Law', 'Photosynthesis')"
              disabled={isPending}
              className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <Button
              type="submit"
              disabled={isPending || !user}
              className="px-6 py-3 h-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {isPending && (
            <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating your video... This may take 30-120 seconds.
            </div>
          )}

          {!user && (
            <div className="mt-3 text-sm text-amber-600">
              Please sign in to generate videos
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
