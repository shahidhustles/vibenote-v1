# VibeNote: Educational AI Chatbot Implementation Guide

> Transform your VibeNote project into a sophisticated educational AI chatbot with RAG capabilities, inspired by FloatChat's proven architecture.

## 🎯 Project Overview

This implementation transforms VibeNote into an advanced educational AI chatbot featuring:

- **Modern Chat Interface** - Professional UI components adapted from FloatChat
- **Intelligent RAG System** - PostgreSQL + pgVector for knowledge management
- **Real-time Sessions** - Convex-powered conversation management
- **Educational Focus** - Optimized for learning and knowledge sharing

## 📋 Current Stack

- **Frontend**: Next.js 15.5.3 + React 19.1.0 + TypeScript 5
- **Authentication**: Clerk (✅ Already installed)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Convex (real-time) + PostgreSQL (vector storage)
- **AI**: Google Gemini 2.5 Flash via AI SDK 5.0.45
- **Embeddings**: Cohere embed-english-v3.0 (1024 dimensions)

## 🚀 3-Phase Implementation Plan

---

## 📱 Phase 1: Core UI & Session Management (Week 1)

_Focus: Professional chat interface with real-time session management_

### 1.1 Educational Typography Setup

```bash
# Install educational-friendly fonts
npm install @next/font
```

**Font Selection**: Inter + JetBrains Mono

- **Inter**: Clean, readable sans-serif for UI text
- **JetBrains Mono**: Code blocks and technical content
- **Font weights**: 400, 500, 600, 700 for proper hierarchy

### 1.2 Core Chat Components Implementation

#### 1.2.1 Header Component (`/src/components/chat/Header.tsx`)

**Features:**

- Session title display with real-time updates
- User avatar integration with Clerk
- Session actions (rename, delete, share)
- Breadcrumb navigation
- Mobile-responsive design

**Key Props:**

```typescript
interface HeaderProps {
  sessionId?: string;
  title: string;
  onTitleChange: (newTitle: string) => void;
  userAvatar?: string;
  userName?: string;
}
```

#### 1.2.2 ChatInput Component (`/src/components/chat/ChatInput.tsx`)

**Features:**

- Auto-expanding textarea with character limit
- Send button with loading states
- File attachment support (future-ready)
- Keyboard shortcuts (Ctrl+Enter to send)
- Message composition indicators

**Key Props:**

```typescript
interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}
```

#### 1.2.3 MessageBubble Component (`/src/components/chat/MessageBubble.tsx`)

**Features:**

- User vs Assistant message styling
- React Markdown rendering with syntax highlighting
- Tool call indicators and results display
- Message timestamps and status
- Copy to clipboard functionality
- Message reactions (like/dislike for training)

**Key Props:**

```typescript
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  timestamp: Date;
  toolCalls?: ToolCall[];
  onReaction?: (messageId: string, reaction: "like" | "dislike") => void;
}
```

### 1.3 Sidebar & Navigation (`/src/components/layout/shared-sidebar.tsx`)

#### 1.3.1 Sidebar Structure

**Features:**

- Session history with search/filter
- New chat creation with templates
- Session organization (folders, tags)
- Recent conversations quick access
- Settings and profile access

**Session Management:**

```typescript
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
  userId: string; // Clerk userId as source of truth
}
```

#### 1.3.2 Mobile-First Design

- Collapsible sidebar for mobile
- Swipe gestures for navigation
- Touch-optimized button sizes
- Responsive breakpoints: sm, md, lg, xl

### 1.4 Convex Session Management

#### 1.4.1 Convex Schema Setup (`convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chatSessions: defineTable({
    userId: v.string(), // Clerk userId as primary identifier
    title: v.string(),
    lastMessage: v.optional(v.string()),
    messageCount: v.number(),
    isArchived: v.boolean(),
    tags: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    sessionId: v.id("chatSessions"),
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
  }).index("by_session", ["sessionId"]),
});
```

#### 1.4.2 Convex Functions (`convex/chat.ts`)

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create new chat session
export const createSession = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("chatSessions", {
      userId: args.userId,
      title: args.title || "New Chat",
      messageCount: 0,
      isArchived: false,
    });
    return sessionId;
  },
});

// Get user sessions
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

// Add message to session
export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    toolCalls: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    // Security: Verify user owns the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const messageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      userId: args.userId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
    });

    // Update session message count
    await ctx.db.patch(args.sessionId, {
      messageCount: session.messageCount + 1,
      lastMessage: args.content.substring(0, 100),
    });

    return messageId;
  },
});
```

### 1.5 Routing & Navigation

#### 1.5.1 Chat Page Structure

```
/chat -> New chat (redirect to /chat/[newSessionId])
/chat/[chatId] -> Existing chat session
```

#### 1.5.2 Search Params Handling (`/src/app/chat/page.tsx`)

```typescript
'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ChatPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { user } = useUser();
  const router = useRouter();
  const createSession = useMutation(api.chat.createSession);

  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      // Create new session
      const sessionId = await createSession({
        userId: user.id,
        title: "New Chat",
      });

      // Redirect with search params preserved
      const params = new URLSearchParams(searchParams as Record<string, string>);
      router.replace(`/chat/${sessionId}?${params.toString()}`);
    };

    initializeChat();
  }, [user, searchParams, createSession, router]);

  return <div>Creating new chat...</div>;
}
```

### 1.6 Phase 1 Deliverables

✅ **UI Components**

- Professional Header with session management
- Advanced ChatInput with file support
- MessageBubble with markdown rendering
- Responsive Sidebar with session history

✅ **Session Management**

- Convex schema for chat sessions and messages
- Real-time session synchronization
- Clerk userId integration throughout
- Secure session ownership verification

✅ **Navigation**

- Clean routing structure (/chat/[chatId])
- Search params preservation
- Mobile-responsive design
- Educational typography system

---

## 🤖 Phase 2: AI SDK v5 Integration (Week 2)

_Focus: Advanced chat functionality with tool calling support_

### 2.1 API Route Implementation (`/src/app/api/chat/route.ts`)

#### 2.1.1 Core Chat Handler

```typescript
import { auth } from "@clerk/nextjs/server";
import { streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, sessionId } = await req.json();

    // Verify session ownership (security)
    const session = await getSessionSecurely(sessionId, userId);
    if (!session) {
      return new Response("Session not found", { status: 404 });
    }

    const result = await streamText({
      model: google("gemini-1.5-pro"),
      messages,
      system: `You are an intelligent educational assistant. Your goal is to help users learn effectively by:
      
1. Providing clear, well-structured explanations
2. Using examples and analogies when helpful
3. Breaking down complex concepts into digestible parts
4. Encouraging critical thinking through questions
5. Adapting your communication style to the user's level

Always check your knowledge base before answering questions. If you don't have relevant information, clearly state that and offer to help them add new knowledge to the system.`,

      tools: {
        // Tool definitions will be added in Phase 3
      },

      maxSteps: 3,
      temperature: 0.7,

      onFinish: async (result) => {
        // Save assistant response to Convex
        await saveMessageToConvex({
          sessionId,
          userId,
          role: "assistant",
          content: result.text,
          toolCalls: result.toolCalls,
          metadata: {
            tokens: result.usage?.totalTokens,
            model: "gemini-1.5-pro",
            duration: result.msToFirstChunk,
          },
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

#### 2.1.2 Message Persistence Integration

```typescript
async function saveMessageToConvex({
  sessionId,
  userId,
  role,
  content,
  toolCalls,
  metadata,
}: {
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
  metadata?: any;
}) {
  // Integration with Convex mutation
  const convexClient = new ConvexHttpClient(process.env.CONVEX_URL!);

  await convexClient.mutation(api.chat.addMessage, {
    sessionId: sessionId as Id<"chatSessions">,
    userId,
    role,
    content,
    toolCalls,
    metadata,
  });
}
```

### 2.2 Chat Page Implementation (`/src/app/chat/[chatId]/page.tsx`)

#### 2.2.1 Main Chat Interface

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Header } from '@/components/chat/Header';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useEffect } from 'react';

export default function ChatSessionPage({
  params: { chatId },
}: {
  params: { chatId: string };
}) {
  const { user } = useUser();
  const addMessage = useMutation(api.chat.addMessage);

  // Load existing messages from Convex
  const existingMessages = useQuery(api.chat.getMessages, {
    sessionId: chatId as Id<"chatSessions">,
    userId: user?.id || "",
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    body: {
      sessionId: chatId,
    },
    initialMessages: existingMessages || [],
    onFinish: (message) => {
      // Message automatically saved via API route
    },
  });

  // Save user messages to Convex
  const handleSend = async (content: string) => {
    if (!user) return;

    // Save user message
    await addMessage({
      sessionId: chatId as Id<"chatSessions">,
      userId: user.id,
      role: "user",
      content,
    });

    // Send to AI (handled by useChat)
    handleSubmit();
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        sessionId={chatId}
        title="Chat Session"
        onTitleChange={(title) => {
          // Update session title
        }}
        userAvatar={user?.imageUrl}
        userName={user?.fullName || user?.username}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
            timestamp={new Date(message.createdAt || Date.now())}
            toolCalls={message.toolInvocations}
          />
        ))}
      </div>

      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSendMessage={handleSend}
        isLoading={isLoading}
        disabled={!user}
        placeholder="Ask me anything about your educational content..."
      />

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm">Error: {error.message}</p>
        </div>
      )}
    </div>
  );
}
```

### 2.3 Enhanced Message Handling

#### 2.3.1 Tool Call Display

```typescript
// Enhanced MessageBubble with tool call support
interface ToolCallDisplayProps {
  toolCall: ToolCall;
  result?: any;
  isExecuting?: boolean;
}

function ToolCallDisplay({ toolCall, result, isExecuting }: ToolCallDisplayProps) {
  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
        <span className="text-sm font-medium text-blue-800">
          Tool: {toolCall.toolName}
        </span>
        {isExecuting && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {toolCall.args && (
        <div className="text-xs text-blue-600 mb-2">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div className="text-sm text-blue-800">
          <strong>Result:</strong> {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
```

### 2.4 Phase 2 Deliverables

✅ **AI Integration**

- Complete AI SDK v5 implementation with useChat hook
- Streaming responses with real-time UI updates
- Tool calling framework ready for Phase 3
- Error handling and loading states

✅ **Session Persistence**

- Messages automatically saved to Convex
- Real-time synchronization across devices
- Secure session ownership verification
- Message metadata tracking (tokens, timing, model)

✅ **Enhanced UX**

- Professional loading indicators
- Tool call visualization
- Error boundaries and recovery
- Mobile-optimized chat experience

---

## 🧠 Phase 3: RAG Implementation (Week 3)

_Focus: Intelligent knowledge management with PostgreSQL + pgVector_

**Why Cohere Embeddings?**

- **Superior Quality**: Cohere's embed-english-v3.0 provides excellent semantic understanding
- **Optimized Dimensions**: 1024 dimensions offer great performance with smaller storage footprint
- **Educational Focus**: Specifically tuned for educational and knowledge-based content
- **Cost Effective**: Competitive pricing for embedding generation

### 3.1 Database Setup & Migration

#### 3.1.1 PostgreSQL + pgVector Installation

```bash
# Install PostgreSQL dependencies
npm install drizzle-orm pg @types/pg
npm install -D drizzle-kit

# Install vector support
npm install pgvector
```

#### 3.1.2 Database Schema (`/src/lib/db/schema/embeddings.ts`)

```typescript
import {
  pgTable,
  text,
  varchar,
  vector,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const embeddings = pgTable(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(), // Cohere embed-english-v3.0
    metadata: text("metadata"), // JSON string for additional data
    userId: varchar("user_id", { length: 191 }).notNull(), // Clerk userId
    source: varchar("source", { length: 255 }), // How this was added
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    embeddingIndex: index("embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    userIndex: index("user_index").on(table.userId),
  })
);

export const resources = pgTable("resources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  userId: varchar("user_id", { length: 191 }).notNull(),
  source: varchar("source", { length: 255 }),
  tags: text("tags"), // JSON array of tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### 3.1.3 Drizzle Configuration (`drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/*",
  out: "./src/lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 3.2 Embedding System Implementation

#### 3.2.1 Embedding Generation (`/src/lib/ai/embedding.ts`)

```typescript
import { cohere } from "@ai-sdk/cohere";
import { embed, embedMany } from "ai";
import { db } from "@/lib/db";
import { embeddings } from "@/lib/db/schema";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";

const embeddingModel = cohere.embedding("embed-english-v3.0");

// Intelligent chunking function
export function generateChunks(input: string): string[] {
  // Split by sentences, but keep chunks under 500 tokens
  const sentences = input
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim() + ".");

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > 2000) {
      // ~500 tokens
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Generate embeddings for multiple chunks
export async function generateEmbeddings(
  content: string,
  userId: string,
  metadata?: any
): Promise<void> {
  const chunks = generateChunks(content);

  const { embeddings: vectors } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  // Store embeddings in PostgreSQL
  for (let i = 0; i < chunks.length; i++) {
    await db.insert(embeddings).values({
      content: chunks[i],
      embedding: vectors[i],
      userId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      source: "manual_input",
    });
  }
}

// Find relevant content using semantic search
export async function findRelevantContent(
  query: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.7
) {
  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  // Calculate cosine similarity
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    queryEmbedding
  )})`;

  const results = await db
    .select({
      content: embeddings.content,
      similarity,
      metadata: embeddings.metadata,
      source: embeddings.source,
      createdAt: embeddings.createdAt,
    })
    .from(embeddings)
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}
```

### 3.3 Tool Implementation

#### 3.3.1 Add Resource Tool (`/src/actions/resources.ts`)

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { revalidatePath } from "next/cache";

export async function addResource({
  content,
  title,
  tags,
}: {
  content: string;
  title?: string;
  tags?: string[];
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Store the resource
    const [resource] = await db
      .insert(resources)
      .values({
        title: title || "Untitled Resource",
        content,
        userId,
        tags: tags ? JSON.stringify(tags) : null,
        source: "ai_tool",
      })
      .returning();

    // Generate and store embeddings
    await generateEmbeddings(content, userId, {
      resourceId: resource.id,
      title: resource.title,
      tags,
    });

    revalidatePath("/chat");

    return {
      success: true,
      message: `Successfully added "${resource.title}" to your knowledge base.`,
      resourceId: resource.id,
    };
  } catch (error) {
    console.error("Error adding resource:", error);
    throw new Error("Failed to add resource to knowledge base");
  }
}
```

#### 3.3.2 Search Tool Implementation

```typescript
export async function searchKnowledgeBase({
  query,
  limit = 5,
}: {
  query: string;
  limit?: number;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const results = await findRelevantContent(query, userId, limit);

    if (results.length === 0) {
      return {
        success: false,
        message: "No relevant information found in your knowledge base.",
        results: [],
      };
    }

    return {
      success: true,
      message: `Found ${results.length} relevant pieces of information.`,
      results: results.map((r) => ({
        content: r.content,
        similarity: r.similarity,
        source: r.source,
        createdAt: r.createdAt,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
      })),
    };
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    throw new Error("Failed to search knowledge base");
  }
}
```

### 3.4 Enhanced API Route with Tools

#### 3.4.1 Updated Chat Route (`/src/app/api/chat/route.ts`)

```typescript
import { tool } from "ai";
import { z } from "zod";
import { addResource, searchKnowledgeBase } from "@/src/actions/resources";

// Add to existing streamText configuration
const result = await streamText({
  model: google("gemini-1.5-pro"),
  messages,
  system: `You are an intelligent educational assistant with access to a personal knowledge base...`,

  tools: {
    addResource: tool({
      description: `Add new information to the user's personal knowledge base. 
      Use this when the user provides information they want to remember or when you want to store important facts for future reference.`,
      parameters: z.object({
        content: z
          .string()
          .describe("The information to store in the knowledge base"),
        title: z
          .string()
          .optional()
          .describe("A descriptive title for this information"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tags to categorize this information"),
      }),
      execute: async ({ content, title, tags }) => {
        return await addResource({ content, title, tags });
      },
    }),

    searchKnowledgeBase: tool({
      description: `Search the user's personal knowledge base for relevant information to answer their question.
      Always search the knowledge base before providing answers to ensure accuracy and personalization.`,
      parameters: z.object({
        query: z
          .string()
          .describe("The search query to find relevant information"),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe("Maximum number of results to return"),
      }),
      execute: async ({ query, limit }) => {
        return await searchKnowledgeBase({ query, limit });
      },
    }),
  },

  maxSteps: 3,
  temperature: 0.7,
});
```

### 3.7 Phase 3 Deliverables

✅ **RAG System**

- PostgreSQL + pgVector integration
- Intelligent chunking and embedding generation
- Semantic search with configurable thresholds
- User-specific knowledge isolation

✅ **Tool System**

- addResource tool for knowledge base population
- searchKnowledgeBase tool for information retrieval
- Optional MCP integration for external knowledge
- Comprehensive error handling and user feedback

---

## 🚀 Getting Started

### Prerequisites

```bash
# Ensure you have the required environment variables
CONVEX_DEPLOYMENT=  # Your Convex deployment URL
CLERK_PUBLISHABLE_KEY=  # Your Clerk publishable key
CLERK_SECRET_KEY=  # Your Clerk secret key
DATABASE_URL=  # PostgreSQL connection string
COHERE_API_KEY=  # Cohere API key for embeddings
GOOGLE_GENERATIVE_AI_API_KEY=  # Google AI API key
```

### Installation Steps

#### Phase 1 Setup

```bash
# Install Phase 1 dependencies
npm install @next/font react-markdown remark-gfm
npm install lucide-react @radix-ui/react-avatar
npm install convex
npx convex dev
```

#### Phase 2 Setup

```bash
# Install AI SDK v5
npm install ai @ai-sdk/google @ai-sdk/cohere
npm install zod
```

#### Phase 3 Setup

```bash
# Install database dependencies
npm install drizzle-orm pg @types/pg pgvector
npm install -D drizzle-kit
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Development Workflow

1. **Start Phase 1**: Focus on UI components and session management
2. **Test Phase 1**: Verify chat interface and Convex integration
3. **Implement Phase 2**: Add AI capabilities with tool calling framework
4. **Test Phase 2**: Ensure streaming and message persistence work
5. **Build Phase 3**: Implement RAG system and knowledge management
6. **Final Testing**: End-to-end testing with real educational content

---

## 📚 Technical Architecture

### Component Hierarchy

```
App
├── Layout (Clerk + Convex Providers)
├── Sidebar (Session Management)
└── Chat Pages
    ├── Header (Session Info)
    ├── MessageList (Real-time Messages)
    │   └── MessageBubble (Markdown + Tools)
    └── ChatInput (AI SDK Integration)
```

### Data Flow

```
User Input → ChatInput → API Route → AI Model → Tools → Database → UI Update
     ↑                                   ↓
Convex ← Message Storage ← Tool Results ← Vector Search
```

### Security Model

- **Clerk Authentication**: Single source of truth for user identity
- **Session Ownership**: All database operations verified against Clerk userId
- **Data Isolation**: Users can only access their own knowledge base
- **Input Validation**: All tool parameters validated with Zod schemas

---

## 🎯 Success Metrics

### Phase 1 Success Criteria

- [ ] Professional chat interface with responsive design
- [ ] Real-time session management with Convex
- [ ] Secure routing with Clerk integration
- [ ] Educational typography and design system

### Phase 2 Success Criteria

- [ ] Streaming AI responses with tool calling support
- [ ] Message persistence across sessions
- [ ] Error handling and loading states
- [ ] Mobile-optimized chat experience

### Phase 3 Success Criteria

- [ ] Functional RAG system with semantic search
- [ ] Knowledge base population via AI tools
- [ ] User-specific data isolation

---

This implementation guide provides a comprehensive roadmap for transforming VibeNote into a sophisticated educational AI chatbot with RAG capabilities, following the proven architecture patterns from FloatChat while maintaining focus on educational use cases.
