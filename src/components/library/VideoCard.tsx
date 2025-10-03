"use client";

import { useState } from "react";
import { Play, Download, Trash2, Info, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

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

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteVideo = useMutation(api.videos.deleteVideo);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteVideo({
        videoId: video.videoId,
        userId: video.userId,
      });
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlay = () => {
    if (video.videoUrl) {
      window.open(video.videoUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (video.videoUrl) {
      const link = document.createElement("a");
      link.href = video.videoUrl;
      link.download = `${video.topic}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle failed videos
  if (video.status === "failed") {
    return (
      <Card className="relative overflow-hidden w-full aspect-[3/2] p-0 border-2 border-red-300 bg-red-50/50">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <X className="w-10 h-10 text-red-600" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Generation Failed
            </p>
            <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px]">
              {video.topic}
            </p>
            {video.errorMessage && (
              <p className="text-xs text-red-600 mt-2">{video.errorMessage}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-2"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remove
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="group relative overflow-hidden w-full aspect-[3/2] p-0 hover:shadow-lg transition-shadow">
        {/* Video thumbnail/preview */}
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800">
          {video.thumbnailUrl || video.videoUrl ? (
            <video
              src={video.videoUrl}
              poster={video.thumbnailUrl || video.videoUrl}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-gray-600" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 p-4 bg-white rounded-full hover:bg-gray-100"
            >
              <Play className="w-8 h-8 text-blue-600 fill-current" />
            </button>
          </div>

          {/* Topic overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium line-clamp-2">
              {video.topic}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDetails(true)}
              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white"
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{video.topic}</DialogTitle>
            <DialogDescription>
              Generated on {new Date(video.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video preview */}
            {video.videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full"
                  poster={video.thumbnailUrl}
                />
              </div>
            )}

            {/* Explanation points */}
            {video.explanationPoints && video.explanationPoints.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Key Points:</h3>
                <ul className="space-y-2">
                  {video.explanationPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm text-gray-700"
                    >
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcript */}
            {video.transcript && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Transcript:</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {video.transcript}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handlePlay} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Open Video
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
