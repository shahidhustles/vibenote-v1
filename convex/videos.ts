import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new video entry with "generating" status
 */
export const createVideo = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const videoId = await ctx.db.insert("videos", {
      videoId: args.videoId,
      userId: args.userId,
      topic: args.topic,
      status: "generating",
      createdAt: Date.now(),
    });
    return videoId;
  },
});

/**
 * Update video status and details after generation
 */
export const updateVideoStatus = mutation({
  args: {
    videoId: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    explanationPoints: v.optional(v.array(v.string())),
    transcript: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the video by videoId
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .first();

    if (!video) {
      throw new Error("Video not found");
    }

    // Update the video
    await ctx.db.patch(video._id, {
      status: args.status,
      videoUrl: args.videoUrl,
      thumbnailUrl: args.thumbnailUrl,
      audioUrl: args.audioUrl,
      explanationPoints: args.explanationPoints,
      transcript: args.transcript,
      errorMessage: args.errorMessage,
    });

    return video._id;
  },
});

/**
 * Get all videos for a specific user
 */
export const getUserVideos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return videos;
  },
});

/**
 * Get a specific video by videoId
 */
export const getVideo = query({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .first();

    return video;
  },
});

/**
 * Delete a video
 */
export const deleteVideo = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the video
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .first();

    if (!video) {
      throw new Error("Video not found");
    }

    // Verify ownership
    if (video.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Delete the video
    await ctx.db.delete(video._id);

    return { success: true };
  },
});

/**
 * Get videos count by status for a user
 */
export const getVideoStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: videos.length,
      generating: videos.filter((v) => v.status === "generating").length,
      completed: videos.filter((v) => v.status === "completed").length,
      failed: videos.filter((v) => v.status === "failed").length,
    };

    return stats;
  },
});
