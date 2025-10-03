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

  // Flashcard decks table for storing AI-generated flashcards
  flashcardDecks: defineTable({
    chatId: v.string(), // Link to chat session
    userId: v.string(), // Clerk userId for access control
    flashcards: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
        hint: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_userId", ["userId"]),

  // Videos table for storing AI-generated educational videos
  videos: defineTable({
    videoId: v.string(), // Unique identifier for the video
    userId: v.string(), // Clerk userId for access control
    topic: v.string(), // Video topic/subject
    videoUrl: v.optional(v.string()), // Cloudinary video URL
    thumbnailUrl: v.optional(v.string()), // Video thumbnail URL
    audioUrl: v.optional(v.string()), // Audio track URL
    explanationPoints: v.optional(v.array(v.string())), // Key points covered
    transcript: v.optional(v.string()), // Video transcript
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()), // Error message if failed
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_videoId", ["videoId"])
    .index("by_status", ["status"]),
});
