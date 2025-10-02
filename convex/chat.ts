import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getSessionByChatId = query({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (session && session.userId !== args.userId) {
      return null;
    }

    return session;
  },
});

export const getMessages = query({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("User ID required");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
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
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("User ID required");
    }

    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId: args.userId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      metadata: args.metadata,
    });

    await ctx.db.patch(session._id, {
      messageCount: session.messageCount + 1,
      lastMessage: args.content.substring(0, 100),
    });

    return messageId;
  },
});

export const createChatWithMessages = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        createdAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("User ID required");
    }

    const existingChat = await ctx.db
      .query("chatSessions")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existingChat) {
      throw new Error("Chat already exists");
    }

    const sessionId = await ctx.db.insert("chatSessions", {
      chatId: args.chatId,
      userId: args.userId,
      title: args.title,
      messageCount: args.messages.length,
      lastMessage: args.messages[args.messages.length - 1]?.content.substring(
        0,
        100
      ),
      isArchived: false,
    });

    for (const message of args.messages) {
      await ctx.db.insert("messages", {
        chatId: args.chatId,
        userId: args.userId,
        role: message.role,
        content: message.content,
      });
    }

    return sessionId;
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("User ID required");
    }

    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(session._id, {
      title: args.title,
    });

    return session;
  },
});

export const updateMessageMetadata = mutation({
  args: {
    messageId: v.id("messages"),
    metadata: v.object({
      tokens: v.optional(v.number()),
      model: v.optional(v.string()),
      duration: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Merge new metadata with existing metadata
    const updatedMetadata = {
      ...message.metadata,
      ...args.metadata,
    };

    await ctx.db.patch(args.messageId, {
      metadata: updatedMetadata,
    });

    return { success: true };
  },
});

export const getChatMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("User ID required");
    }

    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(session._id);

    return { success: true };
  },
});
