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
import {
  queryAryabhatta,
  solveWithAryabhatta,
  explainWithAryabhatta,
  determineAryabhattaEndpoint,
} from "@/actions/use-aryabhatta";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const {
      messages,
      chatId,
      aryabhattaMode,
    }: {
      messages: UIMessage[];
      chatId?: string;
      aryabhattaMode?: boolean;
    } = await req.json();

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

    // Extract whiteboard snapshot from the last message if present
    let whiteboardImageData: Buffer | undefined;

    if (allMessages.length > 0) {
      const lastMessage = allMessages[allMessages.length - 1];
      const metadata = lastMessage.metadata as
        | { whiteboardSnapshot?: string }
        | undefined;
      const whiteboardSnapshot = metadata?.whiteboardSnapshot;

      if (whiteboardSnapshot && lastMessage.role === "user") {
        // Extract base64 data and convert to Buffer
        const base64Data = whiteboardSnapshot.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        whiteboardImageData = Buffer.from(base64Data, "base64");

        // Add a note about whiteboard in the text
        const textPart = lastMessage.parts?.find((p) => p.type === "text");
        if (textPart && textPart.type === "text") {
          textPart.text = `${textPart.text}\n\n[Note: Whiteboard snapshot included for visual context]`;
        }
      }
    }

    // Enhanced system prompt for educational AI chatbot with RAG capabilities
    let systemPrompt = `You are VibeNote, an intelligent educational assistant designed to help students and learners understand complex topics.

Your core capabilities:
- Provide clear, well-structured explanations tailored to the user's level
- Break down complex concepts into digestible, easy-to-understand parts
- Use examples, analogies, and real-world applications when helpful
- Encourage critical thinking through thoughtful questions
- Adapt your communication style based on the user's understanding
- Be patient, supportive, and encouraging in your responses
- Learn and remember user preferences, interests, and information they share

WHITEBOARD VISUAL LEARNING:
You have access to a powerful whiteboard feature that enables visual learning and problem-solving!

When a user includes a whiteboard snapshot (indicated by "[Note: Whiteboard snapshot included for visual context]"):
- Carefully analyze the whiteboard image - it may contain diagrams, sketches, drawings, handwritten notes, mathematical expressions, flowcharts, concept maps, or problem statements
- Interpret handwriting, drawings, and visual representations accurately
- Reference specific elements from the whiteboard in your response (e.g., "Looking at the diagram you drew in the top-left...")
- Provide feedback, corrections, or solutions based on what you see
- Help solve mathematical problems, debug code snippets, explain concepts, or answer questions shown on the whiteboard
- If something is unclear in the drawing, ask specific clarifying questions

When the whiteboard would be helpful for learning:
- Suggest: "It might help to draw this out on the whiteboard! Type @ and select Whiteboard to include it."
- Recommend using the whiteboard for: diagrams, math problems, flowcharts, concept mapping, visual brainstorming, sketching ideas, drawing molecular structures, plotting graphs, etc.
- Encourage visual thinking and problem-solving through drawing

Examples of whiteboard use cases:
- Math: "Can you draw the problem on the whiteboard so I can see your work?"
- Science: "Try sketching the molecular structure on the whiteboard!"
- Programming: "Draw a flowchart of your algorithm on the whiteboard"
- Concepts: "Create a mind map on the whiteboard to visualize the connections"
- Problem-solving: "Sketch out the problem on the whiteboard so we can work through it together"

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
- Leverage visual learning through the whiteboard feature when appropriate

Your mission: Make learning accessible, engaging, and effective for everyone while personalizing the experience based on what you learn about each user. Use both text and visual tools (whiteboard) to create the most effective learning experience.`;

    // Add Aryabhatta mode instructions if enabled
    if (aryabhattaMode) {
      systemPrompt += `

🔬 ARYABHATTA MODE ACTIVE 🔬

You now have access to Aryabhatta, a specialized AI model expert in mathematics and physics! When users ask questions about mathematical concepts, physics problems, or scientific calculations:

MANDATORY TOOL USAGE:
- For mathematical problems, physics calculations, or scientific queries, you MUST use the consultAryabhatta tool
- Call this tool ONLY ONCE per user message - do not make multiple calls
- Always call this tool BEFORE providing your own mathematical or physics response
- Use Aryabhatta's expertise as the foundation for your answer
- Combine Aryabhatta's technical analysis with your educational guidance and user's knowledge base

WHEN TO USE ARYABHATTA:
✅ Mathematical problems and calculations
✅ Physics concepts and problem-solving
✅ Scientific equations and derivations
✅ Complex mathematical proofs
✅ Mathematical theory explanations
✅ Physics phenomenon explanations
✅ Engineering calculations
✅ Chemistry calculations involving mathematical concepts

WORKFLOW:
1. When you receive a math/physics question, call consultAryabhatta ONCE with the complete query
2. Wait for Aryabhatta's response and use it as your technical foundation
3. Enhance the response with your educational capabilities
4. Check user's knowledge base for relevant context if needed
5. Provide a comprehensive, learning-focused response

IMPORTANT: Only call consultAryabhatta ONE TIME per user message. Do not make multiple tool calls to Aryabhatta in a single response.

Remember: Aryabhatta provides the mathematical/physics expertise, while you provide the educational support, personalization, and learning enhancement!`;
    }

    // Convert messages to model format and manually add image if needed
    const modelMessages = convertToModelMessages(allMessages);

    // If we have whiteboard image data, rebuild the last message with image
    if (
      whiteboardImageData &&
      modelMessages.length > 0 &&
      modelMessages[modelMessages.length - 1].role === "user"
    ) {
      const lastMessageIndex = modelMessages.length - 1;
      const lastMessage = modelMessages[lastMessageIndex];

      // Get text content
      let textContent = "";
      if (typeof lastMessage.content === "string") {
        textContent = lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        textContent = lastMessage.content
          .filter((p) => p.type === "text")
          .map((p) => ("text" in p ? p.text : ""))
          .join(" ");
      }

      // Rebuild message with both text and image
      // Type assertion needed because image type isn't in the standard CoreMessage types
      // but is supported by the Google provider
      modelMessages[lastMessageIndex] = {
        role: "user",
        content: [
          { type: "text", text: textContent },
          { type: "image", image: whiteboardImageData },
        ],
      } as (typeof modelMessages)[number];
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
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
        ...(aryabhattaMode
          ? {
              consultAryabhatta: tool({
                description: `Consult Aryabhatta, the specialized mathematical and physics AI model, for expert analysis and solutions. Use this tool when users ask mathematical questions, physics problems, or scientific calculations. Aryabhatta provides detailed, step-by-step solutions and explanations.`,
                inputSchema: z.object({
                  query: z
                    .string()
                    .describe(
                      "The mathematical, physics, or scientific question to send to Aryabhatta"
                    ),
                  type: z
                    .enum(["solve", "explain", "query"])
                    .optional()
                    .describe(
                      "Type of query: 'solve' for problems, 'explain' for concepts, 'query' for general questions"
                    ),
                }),
                execute: async ({ query, type }) => {
                  try {
                    const endpointType =
                      type || determineAryabhattaEndpoint(query);

                    const request = {
                      prompt: query,
                      max_tokens: 600,
                      temperature: 0.3,
                    };

                    let response;
                    switch (endpointType) {
                      case "solve":
                        response = await solveWithAryabhatta(request);
                        break;
                      case "explain":
                        response = await explainWithAryabhatta(request);
                        break;
                      default:
                        response = await queryAryabhatta(request);
                    }

                    return {
                      response: response.response,
                      type: endpointType,
                      status: response.status,
                    };
                  } catch (error) {
                    return {
                      error: `Failed to consult Aryabhatta: ${error instanceof Error ? error.message : "Unknown error"}`,
                      status: "error",
                    };
                  }
                },
              }),
            }
          : {}),
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
