"use client";

import { Video } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
        <Video className="w-10 h-10 text-blue-600" />
      </div>

      {/* Heading */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        No videos yet
      </h3>

      {/* Description */}
      <p className="text-gray-600 max-w-md mb-4">
        Start by entering a topic in the input below to generate your first
        educational video with AI-powered Manim animations.
      </p>

      {/* Example topics */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
        <span className="text-sm text-gray-500">Try topics like:</span>
        <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
          Newton&apos;s Third Law
        </span>
        <span className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full">
          Pythagorean Theorem
        </span>
        <span className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full">
          Photosynthesis
        </span>
      </div>
    </div>
  );
}
