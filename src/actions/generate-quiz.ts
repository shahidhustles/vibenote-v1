"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type QuizQuestion = {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: "a" | "b" | "c" | "d";
  solution: string;
};

export type QuizState = {
  state: "idle" | "loading" | "completed" | "error";
  toastNotification: string;
  quiz: QuizQuestion[];
  error?: string;
};

export const generateQuiz = async (
  prevState: QuizState,
  formData: FormData
): Promise<QuizState> => {
  try {
    const newState: QuizState = {
      ...prevState,
      state: "loading",
      toastNotification: "Generating quiz...",
      quiz: [],
      error: undefined,
    };

    const title = formData.get("title") as string;
    const questions = formData.get("questions") as string;
    const chatId = formData.get("chatId") as string;
    const userId = formData.get("userId") as string;

    if (!title || !questions || !chatId || !userId) {
      return {
        ...newState,
        state: "error",
        error: "Missing required fields",
        toastNotification: "Please fill all required fields",
      };
    }

    const messages = await convex.query(api.chat.getChatMessages, { chatId });

    if (!messages || messages.length === 0) {
      return {
        ...newState,
        state: "error",
        error: "No chat content found",
        toastNotification: "No chat content available to generate quiz from",
      };
    }

    const chatContent = messages
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role}: ${msg.content}`
      )
      .join("\n");

    // Fetch user's videos to get transcript context
    const userVideos = await convex.query(api.videos.getUserVideos, { userId });
    const videoTranscripts = userVideos
      .filter((video) => video.status === "completed" && video.transcript)
      .map((video) => `Topic: ${video.topic}\nTranscript: ${video.transcript}`)
      .join("\n\n");

    const contextContent = `Chat Context:
${chatContent}

${
  videoTranscripts
    ? `Video Transcripts Context:
${videoTranscripts}`
    : ""
}`;

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      prompt: `Based on the following chat conversation and video transcripts, generate a quiz titled "${title}" with ${questions} questions. 
      
      ${contextContent}
      
      Create multiple choice questions based on the key concepts, facts, and learning points discussed in the conversation and covered in the video transcripts. Make sure the questions test understanding and knowledge retention of the main topics from both sources. Include video-specific details and concepts when relevant.`,

      schema: z.object({
        quiz: z
          .array(
            z.object({
              question: z.string().describe("The quiz question"),
              options: z
                .object({
                  a: z.string().describe("Option A"),
                  b: z.string().describe("Option B"),
                  c: z.string().describe("Option C"),
                  d: z.string().describe("Option D"),
                })
                .describe("Four multiple choice options"),
              correctAnswer: z
                .enum(["a", "b", "c", "d"])
                .describe("The correct answer (a, b, c, or d)"),
              solution: z
                .string()
                .describe(
                  "A sentence explaining why this is the correct answer"
                ),
            })
          )
          .length(parseInt(questions))
          .describe(`Array of exactly ${questions} quiz questions`),
      }),
    });

    return {
      state: "completed",
      toastNotification: "Quiz Successfully Generated!",
      quiz: object.quiz,
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    return {
      state: "error",
      toastNotification: "Failed to generate quiz. Please try again.",
      quiz: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
