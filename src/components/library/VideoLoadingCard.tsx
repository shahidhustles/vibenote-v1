"use client";

import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface VideoLoadingCardProps {
  topic: string;
}

export function VideoLoadingCard({ topic }: VideoLoadingCardProps) {
  return (
    <Card className="relative overflow-hidden w-full aspect-[3/2] p-0 border-2 border-dashed border-blue-300 bg-blue-50/50">
      {/* Loading content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
        {/* Animated spinner */}
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />

        {/* Topic being generated */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">Generating video</p>
          <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px]">
            {topic}
          </p>
        </div>

        {/* Animated progress bar */}
        <div className="w-full max-w-[200px] h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
        </div>

        {/* Status text */}
        <p className="text-xs text-gray-500 text-center max-w-[250px]">
          This may take 30-120 seconds...
        </p>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 animate-pulse" />
    </Card>
  );
}
