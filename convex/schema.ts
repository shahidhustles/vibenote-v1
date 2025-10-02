import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chatSessions: defineTable({
    chatId: v.string(), // Client-generated unique chat ID
    userId: v.string(), // Clerk userId as primary identifier
    title: v.string(),
    lastMessage: v.optional(v.string()),
    messageCount: v.number(),
    isArchived: v.boolean(),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_chatId", ["chatId"]),

  messages: defineTable({
    chatId: v.string(), // Reference to chat by client-generated ID
    userId: v.string(), // Clerk userId for security
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    toolCalls: v.optional(v.array(v.any())),
    metadata: v.optional(
      v.object({
        tokens: v.optional(v.number()),
        model: v.optional(v.string()),
        duration: v.optional(v.number()),
        morphikImages: v.optional(v.array(v.string())), // Convex URLs for retrieved images
        morphikContext: v.optional(v.string()), // Text context used by AI
      })
    ),
  }).index("by_chatId", ["chatId"]),

  // Files table for PDF storage (now using Cloudinary)
  files: defineTable({
    userId: v.string(),
    filename: v.string(),
    fileUrl: v.string(), // Cloudinary URL
    fileSize: v.number(),
    uploadedAt: v.number(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  }).index("by_user", ["userId"]),
});
