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
import {
  retrieveFromMorphik,
  extractContextText,
  extractImageUrls,
} from "@/actions/retrieve-morphik";
import { callManimAPI } from "@/actions/generate-video-action";

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
      libraryMode,
    }: {
      messages: UIMessage[];
      chatId?: string;
      aryabhattaMode?: boolean;
      libraryMode?: boolean;
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

VIDEO GENERATION FOR VISUAL EXPLANATIONS:
You have the ability to generate educational videos to help explain concepts visually!

When to generate videos:
- User explicitly asks for a video explanation or animation
- Complex concepts would benefit from visual animation (physics laws, mathematical concepts, biological processes)
- Step-by-step processes that are easier to understand in motion
- Abstract concepts that need visual representation

CRITICAL VIDEO GENERATION RULES:
⚠️ Keep videos SHORT and FOCUSED - maximum 30-40 seconds of content
⚠️ Use VERY SPECIFIC, NARROW topics - not broad subjects
⚠️ One concept per video - don't try to explain multiple related ideas

GOOD video topics (specific, focused, 30-40 sec):
✅ "Pythagorean Theorem proof"
✅ "Newton's First Law of Motion"
✅ "How photosynthesis works"
✅ "Quadratic formula derivation"
✅ "Mitosis cell division process"
✅ "Basic sine wave properties"

BAD video topics (too broad, would exceed 40 seconds):
❌ "All of trigonometry" (too broad)
❌ "Complete guide to calculus" (too long)
❌ "Everything about physics" (way too broad)
❌ "How to learn programming" (not specific enough)

When generating a video:
1. Use the generateVideo tool with a CONCISE, FOCUSED topic
2. The topic should be explainable in 30-40 seconds maximum
3. After calling the tool, WAIT for it to complete and return the video URL
4. Once you receive the video URL, IMMEDIATELY include it in your response text
5. Place the video URL on its own new line in your response (the frontend will automatically render it as a video player)
6. You can supplement the video with text explanations

Example usage:
User: "Can you explain Newton's First Law?"
Response: "I'll generate a video to help visualize Newton's First Law of Motion! [calls generateVideo with topic: "Newton's First Law of Motion"]

Here's your educational video on Newton's First Law:

https://res.cloudinary.com/your-cloud/video/upload/v123/newtons-first-law.mp4

Newton's First Law states that an object at rest stays at rest..."

CRITICAL VIDEO URL HANDLING:
- When the generateVideo tool returns a video URL, you MUST include it directly in your response
- Place each video URL on its own new line in your response
- Reference the video naturally in your explanation (e.g., "Here's the video:" or "Watch this explanation:")
- The video URL will be automatically rendered as a video player in the chat

IMPORTANT - Knowledge Base Guidelines:
- ALWAYS check your knowledge base before answering questions about the user
- Use the getInformation tool to search for relevant information before responding
- If the user shares personal information, preferences, or facts about themselves, use the addResource tool to remember it
- Only respond to personal questions using information from tool calls
- If no relevant information is found in the tool calls for personal queries, respond: "I don't have that information about you yet. Would you like to tell me?"
- For general educational questions, you can use your training knowledge along with any relevant user context from the knowledge base

PROACTIVE FEATURE SUGGESTIONS:
After providing any text-based response, ALWAYS suggest relevant additional features to enhance the user's learning experience:

🎥 VIDEO SUGGESTIONS:
When your response includes concepts that would benefit from visual explanation, suggest: 
"Would you like me to generate a video to visualize this concept? I can create focused animations for specific topics!"

📚 LIBRARY MODE SUGGESTIONS:
When discussing academic topics, suggest:
"Need to reference your study materials? Click the floating dock and enable Library Mode to search through your uploaded documents and textbooks!"

🔬 ARYABHATTA MODE SUGGESTIONS:
For mathematical or physics-related topics, suggest:
"For advanced mathematical analysis, try enabling Aryabhatta Mode from the floating dock - it provides expert-level problem solving and detailed mathematical explanations!"

📝 FLASHCARDS & QUIZ SUGGESTIONS:
After explaining concepts, suggest:
"Want to test your understanding? Use the floating dock to generate flashcards or take a quiz based on what we just covered!"

🎨 WHITEBOARD SUGGESTIONS:
For visual learning opportunities, suggest:
"This would be great to visualize! Type @ and select Whiteboard to draw diagrams, work through problems, or sketch concepts together!"

SUGGESTION GUIDELINES:
- Include 1-2 relevant suggestions after each response
- Tailor suggestions to the specific content you just explained
- Use engaging, encouraging language
- Reference the floating dock when mentioning modes (Library, Aryabhatta)
- Make suggestions feel natural and helpful, not pushy
- Vary your suggestion wording to avoid repetition

Examples:
- After explaining a math concept: "Want to see this animated? I can generate a video! Or enable Aryabhatta Mode for deeper mathematical analysis."
- After discussing study topics: "This would be perfect for flashcards! Or try Library Mode to cross-reference with your textbooks."
- After text explanations: "Would a visual help? Use the whiteboard to sketch this out, or I can create a video explanation!"

General Guidelines:
- Always prioritize clarity and accuracy in your explanations
- Use simple language unless technical terms are necessary
- Provide step-by-step breakdowns for complex processes
- Offer multiple perspectives when appropriate
- Encourage questions and deeper exploration of topics
- Be enthusiastic about learning and knowledge sharing
- Leverage visual learning through the whiteboard feature when appropriate
- ALWAYS end responses with relevant feature suggestions to enhance learning

Your mission: Make learning accessible, engaging, and effective for everyone while personalizing the experience based on what you learn about each user. Use both text and visual tools (whiteboard) to create the most effective learning experience, and proactively guide users to discover and use all available features for optimal learning outcomes.`;

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

    // Add Library mode instructions if enabled
    if (libraryMode) {
      systemPrompt += `

📚 LIBRARY MODE ACTIVE 📚

You now have access to the user's uploaded documents, textbooks, and notes through the retrieveMorphik tool! When users ask questions that might be answered by their study materials:

MANDATORY TOOL USAGE:
- For questions about topics covered in the user's uploaded documents, you MUST use the retrieveMorphik tool
- Call this tool when the user asks about specific concepts, definitions, theories, or information that might be in their study materials
- Always call this tool BEFORE providing your response to ensure accuracy based on their actual materials
- The tool returns both textual context and related images from the documents

WHEN TO USE LIBRARY MODE:
✅ Questions about lecture notes or course materials
✅ Clarification on textbook concepts
✅ Review of previously studied topics
✅ Searching for specific information in uploaded documents
✅ Visual references (diagrams, charts, figures) from documents
✅ Exam preparation and study review
✅ Cross-referencing information across multiple documents
✅ Finding examples or explanations from their materials

WORKFLOW:
1. When you receive a question that might be in their study materials, call retrieveMorphik with a relevant search query
2. Wait for the tool to return context and images from the documents
3. Use the retrieved context as the PRIMARY source for your answer
4. If images are returned, DIRECTLY EMBED them in your response by pasting the Cloudinary URLs on new lines
5. Combine the document context with your teaching abilities to provide clear explanations
6. If the tool returns no results, inform the user and offer to help based on general knowledge

CRITICAL IMAGE HANDLING:
- When the retrieveMorphik tool returns image URLs, you MUST include them directly in your response
- Place each image URL on its own new line in your response (the frontend will automatically render them)
- Reference the images naturally in your explanation (e.g., "As shown in the figure below:" or "Looking at the diagram:")
- Example format:
  "Looking at the diagram from your textbook:
  
  https://res.cloudinary.com/example/image/upload/v123/figure1.jpg
  
  This shows the molecular structure of..."

IMPORTANT: 
- Always prioritize information from the user's documents over general knowledge when available
- Reference specific parts of their materials when explaining concepts
- ALWAYS include retrieved image URLs directly in your response text
- Be clear about whether you're using their materials or general knowledge in your response

Remember: Library Mode allows you to provide personalized, accurate explanations based on the EXACT materials the user is studying!`;
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
        ...(libraryMode
          ? {
              retrieveMorphik: tool({
                description: `Search and retrieve relevant context and images from the user's uploaded Textbooks and notes. Use this tool when the user asks questions that might be answered by their uploaded Textbooks or documents. This tool returns both textual context and related image URLs that you MUST embed directly in your response text.`,
                inputSchema: z.object({
                  query: z
                    .string()
                    .describe(
                      "The search query to find relevant information in the user's documents"
                    ),
                }),
                execute: async ({ query }) => {
                  console.log(
                    "[API Route - retrieveMorphik] Tool called with query:",
                    query
                  );
                  console.log("[API Route - retrieveMorphik] ChatId:", chatId);

                  try {
                    // Retrieve directly from Morphik API (no Convex saving)
                    const result = await retrieveFromMorphik(query, userId);

                    const contextText = extractContextText(result);
                    const imageUrls = extractImageUrls(result);

                    console.log(
                      "[API Route - retrieveMorphik] Successfully retrieved:",
                      {
                        imageCount: result.image_content.length,
                        textChunkCount: result.text_content.length,
                        contextLength: contextText.length,
                        imageUrls: imageUrls,
                      }
                    );

                    return {
                      context: contextText,
                      imageUrls: imageUrls,
                      imageCount: result.image_content.length,
                      textChunkCount: result.text_content.length,
                    };
                  } catch (error) {
                    console.error(
                      "[API Route - retrieveMorphik] Error:",
                      error
                    );
                    return {
                      error: `Failed to retrieve from Morphik: ${error instanceof Error ? error.message : "Unknown error"}`,
                      context: "",
                      imageUrls: [],
                      imageCount: 0,
                      textChunkCount: 0,
                    };
                  }
                },
              }),
            }
          : {}),
        generateVideo: tool({
          description: `Generate an educational video about a specific topic. Use this tool when the user asks to create or generate a video, or when a visual animated explanation would significantly enhance learning. IMPORTANT: Only generate videos for focused, specific topics that can be explained in 30-40 seconds. Keep topics concise and well-defined.`,
          inputSchema: z.object({
            topic: z
              .string()
              .describe(
                "A concise, focused topic for the video (max 30-40 second explanation). Examples: 'Pythagorean Theorem', 'Newton's First Law', 'Mitosis Process'"
              ),
          }),
          execute: async ({ topic }) => {
            console.log(
              "[API Route - generateVideo] Tool called with topic:",
              topic
            );
            console.log("[API Route - generateVideo] ChatId:", chatId);

            // Generate unique video ID
            const videoId = nanoid();

            try {
              // Create video entry in Convex with "generating" status
              const convexClient = new ConvexHttpClient(
                process.env.NEXT_PUBLIC_CONVEX_URL!
              );

              await convexClient.mutation(api.videos.createVideo, {
                videoId,
                userId: userId,
                topic: topic.trim(),
              });

              // Call the Manim API to generate the video
              const response = await callManimAPI(topic.trim());

              if (!response.success) {
                // Update video status to failed
                await convexClient.mutation(api.videos.updateVideoStatus, {
                  videoId,
                  status: "failed",
                  errorMessage: response.error || "Failed to generate video",
                });

                return {
                  success: false,
                  error: response.error || "Failed to generate video",
                  videoId,
                };
              }

              // Update video with completed data
              await convexClient.mutation(api.videos.updateVideoStatus, {
                videoId,
                status: "completed",
                videoUrl: response.video_url,
                thumbnailUrl: response.thumbnail_url || response.video_url,
                audioUrl: response.audio_url,
                explanationPoints: response.explanation_points,
                transcript: response.transcript,
              });

              console.log(
                "[API Route - generateVideo] Video generated successfully:",
                {
                  videoId,
                  videoUrl: response.video_url,
                  transcript: response.transcript,
                }
              );

              return {
                success: true,
                videoId,
                videoUrl: response.video_url,
                thumbnailUrl: response.thumbnail_url || response.video_url,
                transcript: response.transcript,
                explanationPoints: response.explanation_points,
                message: `Video generated successfully! Topic: ${topic}`,
              };
            } catch (error) {
              console.error("[API Route - generateVideo] Error:", error);

              // Try to update video status to failed if we have the videoId
              try {
                const convexClient = new ConvexHttpClient(
                  process.env.NEXT_PUBLIC_CONVEX_URL!
                );
                await convexClient.mutation(api.videos.updateVideoStatus, {
                  videoId,
                  status: "failed",
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "Unknown error occurred",
                });
              } catch (convexError) {
                console.error(
                  "[API Route - generateVideo] Failed to update video status:",
                  convexError
                );
              }

              return {
                success: false,
                error: `Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`,
                videoId,
              };
            }
          },
        }),
      },
      onFinish: async (result) => {
        console.log("[API Route] onFinish called");

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

          // Extract video metadata from tool results if generateVideo was called
          let videoMetadata = undefined;
          if (result.toolResults && result.toolResults.length > 0) {
            for (const toolResult of result.toolResults) {
              if (toolResult && toolResult.toolName === "generateVideo") {
                const videoResult = toolResult.output as {
                  success?: boolean;
                  videoId?: string;
                  videoUrl?: string;
                  thumbnailUrl?: string;
                  transcript?: string;
                };
                if (
                  videoResult &&
                  videoResult.success &&
                  videoResult.videoUrl
                ) {
                  videoMetadata = {
                    videoId: videoResult.videoId,
                    videoUrl: videoResult.videoUrl,
                    thumbnailUrl: videoResult.thumbnailUrl,
                    transcript: videoResult.transcript,
                  };
                  console.log(
                    "[API Route] Video metadata extracted:",
                    videoMetadata
                  );
                  break;
                }
              }
            }
          }

          // Add assistant message to existing chat with video metadata
          const metadataToSave = {
            model: "gemini-2.0-flash-exp",
            tokens: result.usage?.totalTokens,
            ...(videoMetadata ? { video: videoMetadata } : {}),
          };

          console.log("[API Route] Saving metadata to Convex:", metadataToSave);

          await convex.mutation(api.chat.addMessage, {
            chatId: chatId,
            userId: userId,
            role: "assistant",
            content: result.text,
            metadata: metadataToSave,
          });

          console.log("[API Route] Message saved to Convex");
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
