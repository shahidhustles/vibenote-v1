"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { VideoGrid } from "@/components/library/VideoGrid";
import { VideoGenerationInput } from "@/components/library/VideoGenerationInput";
import { EmptyState } from "@/components/library/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [generatingTopics, setGeneratingTopics] = useState<string[]>([]);

  // Fetch user's videos from Convex
  const videos = useQuery(
    api.videos.getUserVideos,
    user ? { userId: user.id } : "skip"
  );

  const handleGenerationStart = (topic: string) => {
    setGeneratingTopics((prev) => [...prev, topic]);
  };

  const handleGenerationComplete = () => {
    // Remove the first generating topic (FIFO)
    setGeneratingTopics((prev) => prev.slice(1));
  };

  // Loading state
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/2] w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Please sign in
            </h2>
            <p className="text-gray-600">
              You need to be signed in to access the video library.
            </p>
          </div>
        </main>
        <VideoGenerationInput
          onGenerationStart={handleGenerationStart}
          onGenerationComplete={handleGenerationComplete}
        />
      </div>
    );
  }

  const hasVideos = videos && videos.length > 0;
  const hasGeneratingVideos = generatingTopics.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Show empty state if no videos and nothing generating */}
        {!hasVideos && !hasGeneratingVideos && <EmptyState />}

        {/* Show video grid if there are videos or generating videos */}
        {(hasVideos || hasGeneratingVideos) && (
          <VideoGrid
            videos={videos || []}
            generatingTopics={generatingTopics}
          />
        )}

        {/* Show loading state while fetching videos */}
        {videos === undefined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/2] w-full" />
            ))}
          </div>
        )}
      </main>

      {/* Fixed input at bottom */}
      <VideoGenerationInput
        onGenerationStart={handleGenerationStart}
        onGenerationComplete={handleGenerationComplete}
      />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate educational videos with AI-powered Manim animations
            </p>
          </div>
          {/* You can add additional header actions here (e.g., filters, search) */}
        </div>
      </div>
    </header>
  );
}
