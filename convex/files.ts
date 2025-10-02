import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate a URL for uploading a file to Convex storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Save file metadata after successful upload to Cloudinary
 */
export const saveFile = mutation({
  args: {
    userId: v.string(),
    filename: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      userId: args.userId,
      filename: args.filename,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
      status: "uploaded",
    });
    return fileId;
  },
});

/**
 * Get file metadata by fileId
 */
export const getFile = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    return file;
  },
});

/**
 * Get all files for a specific user
 */
export const getUserFiles = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return files;
  },
});

/**
 * Update file status (used during processing)
 */
export const updateFileStatus = mutation({
  args: {
    fileId: v.id("files"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      status: args.status,
    });
  },
});
