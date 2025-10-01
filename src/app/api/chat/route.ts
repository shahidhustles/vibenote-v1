import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  generateText,
  tool,
  stepCountIs,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";
import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
      await req.json();

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get existing messages from Convex if chatId is provided
    let existingMessages: Array<{
      _id: string;
      role: string;
      content: string;
      createdAt?: number;
    }> = [];

    if (chatId) {
      try {
        existingMessages = await convex.query(api.chat.getMessages, {
          chatId: chatId,
          userId: userId,
        });
      } catch {
        // No existing messages found, starting new chat
      }
    }

    // Convert existing messages to UIMessage format and combine with current messages
    const existingUIMessages: UIMessage[] = existingMessages.map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: msg.content }],
    }));

    // Combine existing messages with new messages (avoid duplicates)
    const existingIds = new Set(existingUIMessages.map((msg) => msg.id));
    const newMessages = messages.filter((msg) => !existingIds.has(msg.id));
    const allMessages = [...existingUIMessages, ...newMessages];

    // Enhanced system prompt for educational AI chatbot with RAG capabilities
    const systemPrompt = `You are VibeNote, an intelligent educational assistant designed to help students and learners understand complex topics.

Your core capabilities:
- Provide clear, well-structured explanations tailored to the user's level
- Break down complex concepts into digestible, easy-to-understand parts
- Use examples, analogies, and real-world applications when helpful
- Encourage critical thinking through thoughtful questions
- Adapt your communication style based on the user's understanding
- Be patient, supportive, and encouraging in your responses
- Learn and remember user preferences, interests, and information they share

IMPORTANT - Knowledge Base Guidelines:
- ALWAYS check your knowledge base before answering questions about the user
- Use the getInformation tool to search for relevant information before responding
- If the user shares personal information, preferences, or facts about themselves, use the addResource tool to remember it
- Only respond to personal questions using information from tool calls
- If no relevant information is found in the tool calls for personal queries, respond: "I don't have that information about you yet. Would you like to tell me?"
- For general educational questions, you can use your training knowledge along with any relevant user context from the knowledge base

General Guidelines:
- Always prioritize clarity and accuracy in your explanations
- Use simple language unless technical terms are necessary
- Provide step-by-step breakdowns for complex processes
- Offer multiple perspectives when appropriate
- Encourage questions and deeper exploration of topics
- Be enthusiastic about learning and knowledge sharing

Your mission: Make learning accessible, engaging, and effective for everyone while personalizing the experience based on what you learn about each user.`;

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: convertToModelMessages(allMessages),
      temperature: 0.7,
      stopWhen: stepCountIs(5),
      tools: {
        addResource: tool({
          description: `Add a resource to the user's personal knowledge base. Use this when the user shares information about themselves, their preferences, interests, goals, or any personal facts they want you to remember. If the user provides information unprompted, use this tool without asking for confirmation.`,
          inputSchema: z.object({
            content: z
              .string()
              .describe("the content or resource to add to the knowledge base"),
          }),
          execute: async ({ content }) => createResource({ content, userId }),
        }),
        getInformation: tool({
          description: `Search the user's personal knowledge base to find relevant information to answer their questions. Use this before answering questions about the user's preferences, history, or personal information.`,
          inputSchema: z.object({
            question: z.string().describe("the user's question"),
          }),
          execute: async ({ question }) =>
            findRelevantContent(question, userId),
        }),
      },

      onFinish: async (result) => {
        // Determine if it's the first message for this chat
        const isFirstMessage = existingMessages.length === 0;

        // Save the assistant message
        const assistantMessage = {
          id: nanoid(),
          role: "assistant" as const,
          content: result.text,
          createdAt: Date.now(),
        };

        // Handle chat creation/update
        if (isFirstMessage && chatId) {
          // Generate a 3-word title for the new chat
          const userMessage = newMessages[0];
          let generatedTitle = "New Chat"; // Fallback title

          try {
            // Use AI to generate a meaningful 3-4 word title from the conversation
            const userContent =
              userMessage.parts
                ?.map((p) => (p.type === "text" ? p.text : ""))
                .join(" ") || "New Chat";

            const titleGeneration = await generateText({
              model: google("gemini-2.0-flash-exp"),
              prompt: `Based on this conversation between a user and VibeNote (an educational AI assistant), generate a concise 3-4 word title that captures the main topic:

User: ${userContent}
Assistant: ${result.text}

Generate only the title, no quotes or additional text. Keep it under 25 characters.`,
            });

            generatedTitle =
              titleGeneration.text.trim().substring(0, 25) || "New Chat";
          } catch {
            // Fallback to simple word extraction if AI generation fails
            const userContent =
              userMessage.parts
                ?.map((p) => (p.type === "text" ? p.text : ""))
                .join(" ") || "New Chat";
            const words = userContent.trim().split(/\s+/);
            generatedTitle =
              words.length > 0
                ? words.slice(0, 3).join(" ").substring(0, 25)
                : "New Chat";
          }

          // Create new chat with both first user message and assistant message
          const firstUserMessage = {
            id: nanoid(),
            role: "user" as const,
            content:
              userMessage.parts
                ?.map((p) => (p.type === "text" ? p.text : ""))
                .join(" ") || "user message",
            createdAt: Date.now(),
          };

          await convex.mutation(api.chat.createChatWithMessages, {
            chatId: chatId,
            userId: userId,
            title: generatedTitle,
            messages: [firstUserMessage, assistantMessage],
          });
        } else if (chatId) {
          // For existing chats, save user message first, then assistant message
          if (newMessages.length > 0) {
            const lastUserMessage = newMessages[newMessages.length - 1];
            if (lastUserMessage.role === "user") {
              await convex.mutation(api.chat.addMessage, {
                chatId: chatId,
                userId: userId,
                role: "user",
                content:
                  lastUserMessage.parts
                    ?.map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ") || "user message",
              });
            }
          }

          // Add assistant message to existing chat
          await convex.mutation(api.chat.addMessage, {
            chatId: chatId,
            userId: userId,
            role: "assistant",
            content: result.text,
            metadata: {
              model: "gemini-2.0-flash-exp",
              tokens: result.usage?.totalTokens,
            },
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
