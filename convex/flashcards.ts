import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrUpdateFlashcardDeck = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    flashcards: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
        hint: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingDeck = await ctx.db
      .query("flashcardDecks")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existingDeck) {
      await ctx.db.patch(existingDeck._id, {
        flashcards: args.flashcards,
        updatedAt: Date.now(),
      });
      return existingDeck._id;
    } else {
      const deckId = await ctx.db.insert("flashcardDecks", {
        chatId: args.chatId,
        userId: args.userId,
        flashcards: args.flashcards,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return deckId;
    }
  },
});

export const getFlashcardDeck = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db
      .query("flashcardDecks")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();
    return deck;
  },
});

export const getUserFlashcardDecks = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const decks = await ctx.db
      .query("flashcardDecks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return decks;
  },
});

export const deleteFlashcardDeck = mutation({
  args: {
    deckId: v.id("flashcardDecks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.deckId);
  },
});
