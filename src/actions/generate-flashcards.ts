"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { currentUser } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { createFlashcardReminders } from "@/lib/google-calendar";
import { z } from "zod";
import { api } from "../../convex/_generated/api";


const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type ActionState = {
  state: "idle" | "loading" | "completed" | "error";
  message?: string;
};

const flashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      hint: z.string().optional(),
    })
  ),
});

export const generateFlashcards = async (
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const user = await currentUser();
    if (!user) {
      return { state: "error", message: "User not authenticated" };
    }

    const numFlashcards =
      parseInt(formData.get("numFlashcards") as string) || 3;
    const enableHints = formData.get("enableHints") === "on";
    const enableReminder = formData.get("enableReminder") === "on";
    const chatId = formData.get("chatId") as string;

    if (!chatId) {
      return { state: "error", message: "Chat ID is required" };
    }

    // Get messages from the chat
    const messages = await convex.query(api.chat.getMessages, {
      chatId,
      userId: user.id,
    });

    const chatContext = messages
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role}: ${msg.content}`
      )
      .join("\n");

    // Get chat title
    const chat = await convex.query(api.chat.getSessionByChatId, {
      chatId,
      userId: user.id,
    });
    const chatTitle = chat?.title || "Untitled Chat";

    // Generate flashcards using AI
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const prompt = `Based on the following chat conversation, generate ${numFlashcards} educational flashcards. ${
      enableHints
        ? "Include helpful hints for each flashcard."
        : "Do not include hints."
    }

Chat conversation:
${chatContext}

Create flashcards that test understanding of the key concepts discussed. Make the questions clear and the answers concise but informative.`;

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: flashcardSchema,
      prompt,
    });

    // Save flashcards to database
    await convex.mutation(api.flashcards.createOrUpdateFlashcardDeck, {
      chatId,
      userId: user.id,
      flashcards: object.flashcards,
    });

    // Create calendar reminders if enabled
    if (enableReminder) {
      try {
        const flashcardTitle = `${chatTitle} - ${numFlashcards} Cards`;
        const reminderSuccess = await createFlashcardReminders(
          user.id,
          flashcardTitle,
          chatTitle,
          chatId
        );

        if (!reminderSuccess) {
          return {
            state: "completed",
            message:
              "Flashcards generated successfully! However, calendar reminders could not be created. Please ensure you have connected your Google Calendar.",
          };
        }

        return {
          state: "completed",
          message:
            "Flashcards generated successfully with calendar reminders set up!",
        };
      } catch (error) {
        console.error("Error creating calendar reminders:", error);
        return {
          state: "completed",
          message:
            "Flashcards generated successfully! However, calendar reminders could not be created.",
        };
      }
    }

    return {
      state: "completed",
      message: "Flashcards generated successfully!",
    };
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return { state: "error", message: "Failed to generate flashcards" };
  }
};
