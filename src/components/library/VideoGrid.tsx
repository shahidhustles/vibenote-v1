"use client";

import { VideoCard } from "./VideoCard";
import { VideoLoadingCard } from "./VideoLoadingCard";

interface Video {
  _id: string;
  videoId: string;
  userId: string;
  topic: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  explanationPoints?: string[];
  transcript?: string;
  status: "generating" | "completed" | "failed";
  errorMessage?: string;
  createdAt: number;
}

interface VideoGridProps {
  videos: Video[];
  generatingTopics?: string[];
}

export function VideoGrid({ videos, generatingTopics = [] }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {/* Show loading cards for topics being generated */}
      {generatingTopics.map((topic, index) => (
        <VideoLoadingCard key={`loading-${index}`} topic={topic} />
      ))}

      {/* Show video cards for existing videos */}
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}
