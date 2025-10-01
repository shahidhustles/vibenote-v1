"use client";

import React, { useEffect, useRef, use, useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatInstancePageProps {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    initialMessage?: string;
    expertMode?: string;
  }>;
}

export default function ChatInstancePage({
  params,
  searchParams,
}: ChatInstancePageProps) {
  // Unwrap the promises
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const chatId = unwrappedParams.chatId;

  // Get current user from Clerk
  const { user } = useUser();

  // Expert mode state
  const [expertMode, setExpertMode] = useState(false);

  // Load existing messages from database
  const existingMessages = useQuery(
    api.chat.getMessages,
    user?.id
      ? {
          chatId: chatId,
          userId: user.id,
        }
      : "skip"
  );

  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to track if initial message has been sent
  const initialMessageSent = useRef(false);
  const existingMessagesLoaded = useRef(false);

  // Use the v5 useChat hook with proper transport
  const { messages, status, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => {
        // Extract expert mode from the last message's metadata
        const lastMessage = messages[messages.length - 1];
        const expertModeFromMessage =
          (lastMessage?.metadata as { expertMode?: boolean })?.expertMode ||
          false;

        return {
          body: {
            chatId: chatId, // Always pass the chatId from URL
            messages,
            expertMode: expertModeFromMessage, // Pass expert mode flag
            ...body,
          },
        };
      },
    }),
  });

  // Load existing messages into the chat when they're available
  useEffect(() => {
    if (existingMessages !== undefined && !existingMessagesLoaded.current) {
      // existingMessages is an array (empty or with messages) or null
      if (existingMessages && existingMessages.length > 0) {
        const convertedExistingMessages = existingMessages.map((msg) => ({
          id: msg._id,
          role: msg.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: msg.content }],
        }));
        setMessages(convertedExistingMessages);
      }

      // Mark as loaded regardless of whether we found messages or not
      existingMessagesLoaded.current = true;
    }
  }, [existingMessages, setMessages]);

  // Set expert mode from URL parameter
  useEffect(() => {
    if (unwrappedSearchParams.expertMode === "true") {
      setExpertMode(true);
    }
  }, [unwrappedSearchParams.expertMode]);

  // Handle initial message from search params
  const handleInitialMessage = useCallback(() => {
    if (
      unwrappedSearchParams.initialMessage &&
      messages.length === 0 &&
      !initialMessageSent.current &&
      existingMessagesLoaded.current // Only proceed after we've loaded existing messages
    ) {
      const initialMsg = decodeURIComponent(
        unwrappedSearchParams.initialMessage
      );
      // Send the initial message immediately
      sendMessage({
        text: initialMsg,
        metadata: { expertMode: expertMode }, // Use expert mode from state
      });
      initialMessageSent.current = true;
    }
  }, [
    unwrappedSearchParams.initialMessage,
    messages.length,
    sendMessage,
    expertMode,
  ]);

  // For new chats with initial message, send it immediately without waiting
  useEffect(() => {
    if (
      unwrappedSearchParams.initialMessage &&
      !initialMessageSent.current &&
      messages.length === 0 &&
      existingMessages !== undefined && // Convex query has completed (empty array for new chat)
      user // Ensure user is authenticated
    ) {
      const initialMsg = decodeURIComponent(
        unwrappedSearchParams.initialMessage
      );
      sendMessage({
        text: initialMsg,
        metadata: { expertMode: expertMode }, // Use expert mode from state
      });
      initialMessageSent.current = true;
      existingMessagesLoaded.current = true; // Mark as loaded since it's a new chat
    }
  }, [
    unwrappedSearchParams.initialMessage,
    messages.length,
    sendMessage,
    existingMessages,
    expertMode,
    user,
  ]);

  useEffect(() => {
    handleInitialMessage();
  }, [handleInitialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, status]);

  const handleSendMessage = (
    content: string,
    expertModeFlag: boolean = false
  ) => {
    // Don't send messages while loading existing messages or if user is not loaded
    if (isLoadingExistingMessages || !user) return;

    // Send message using v5 API with expert mode flag
    sendMessage({
      text: content,
      metadata: { expertMode: expertModeFlag },
    });
  };

  const isLoading = status === "streaming" || status === "submitted";
  // Only show loading spinner if Convex is still querying AND we don't have an initial message to send
  // For new chats with initial messages, skip the loading state to avoid blank screen
  const isLoadingExistingMessages =
    existingMessages === undefined && !unwrappedSearchParams.initialMessage;

  // Show loading if user is not yet loaded
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"
          role="status"
          aria-label="Loading user"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Main Chat Container */}
      <div className="flex flex-col h-full">
        {/* Messages Container - Full width scrollable area */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          {/* Centered content wrapper */}
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            {/* Show loading state while fetching existing messages */}
            {isLoadingExistingMessages ? (
              <>
                {/* AI Message Skeleton */}
                <div className="flex gap-3 justify-start">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="max-w-2xl w-full space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>

                {/* User Message Skeleton */}
                <div className="flex gap-3 justify-end">
                  <div className="max-w-2xl w-full space-y-2 flex flex-col items-end">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                </div>

                {/* AI Message Skeleton */}
                <div className="flex gap-3 justify-start">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="max-w-2xl w-full space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    userAvatar={user.imageUrl}
                    userName={user.fullName || user.username || undefined}
                  />
                ))}

                {isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-lg p-4 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="rounded-full bg-gradient-to-r from-purple-400 to-blue-400 h-1 w-1"></div>
                            <div className="rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 h-1 w-1"></div>
                            <div className="rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 h-1 w-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input at Bottom */}
        <div className="border-t border-purple-200/50 bg-white/70 backdrop-blur-sm p-4">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
