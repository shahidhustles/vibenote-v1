"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot } from "lucide-react";
import type { UIMessage } from "ai";
import Image from "next/image";
import ShiningText from "@/components/ui/shining-text";

interface MessageBubbleProps {
  message: UIMessage;
  userAvatar?: string;
  userName?: string;
}

export function MessageBubble({
  message,
  userAvatar,
  userName,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar for AI (left side) */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-2xl rounded-lg px-4 py-3 ${
          isUser
            ? "bg-gradient-to-r from-purple-200 via-blue-200 to-cyan-200 text-gray-900 border border-purple-200"
            : "bg-white/80 backdrop-blur-sm text-gray-900 border border-purple-100"
        }`}
      >
        {/* Render all message parts */}
        {message.parts.map((part, index) => {
          switch (part.type) {
            case "text":
              return (
                <div key={index}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{part.text}</p>
                  ) : part.text.length > 0 ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return match ? (
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className="bg-gray-200 px-1 py-0.5 rounded text-sm"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border-collapse border border-gray-300">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-semibold">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-gray-300 px-3 py-2">
                              {children}
                            </td>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mb-3 text-gray-900">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-md font-semibold mb-2 text-gray-700">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 text-gray-900 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-900">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-2">
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-800">{children}</em>
                          ),
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                </div>
              );

            // Handle addResource tool calls
            case "tool-addResource":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part, "addResource")}
                </div>
              );

            // Handle getInformation tool calls
            case "tool-getInformation":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part, "getInformation")}
                </div>
              );

            // Handle other tool calls
            default:
              return null;
          }
        })}

        {/* Timestamp */}
        <div className="mt-2 text-xs opacity-70">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Avatar for User (right side) */}
      {isUser && (
        <div className="flex-shrink-0">
          {userAvatar ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-300">
              <Image
                src={userAvatar}
                alt={userName || "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to render tool calls based on their state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderToolCall(part: any, toolName: string) {
  const toolCallId = part.toolCallId;

  // Render based on tool type
  if (toolName === "addResource") {
    switch (part.state) {
      case "input-streaming":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(147, 51, 234, 0.7)"
              className="text-md font-medium"
            >
              Preparing to save information...
            </ShiningText>
          </div>
        );
      case "input-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(147, 51, 234, 0.7)"
              className="text-md font-medium"
            >
              Saving: &ldquo;
              {part.input?.content?.substring(0, 50) || "information"}
              {part.input?.content?.length > 50 ? "..." : ""}
              &rdquo;
            </ShiningText>
          </div>
        );
      case "output-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(147, 51, 234, 0.7)"
              className="text-md font-medium"
            >
              Information saved to your knowledge base
            </ShiningText>
          </div>
        );
      case "output-error":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(239, 68, 68, 0.7)"
              className="text-md font-medium"
            >
              Error: {part.errorText || "Failed to save information"}
            </ShiningText>
          </div>
        );
      default:
        return null;
    }
  }

  if (toolName === "getInformation") {
    switch (part.state) {
      case "input-streaming":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(59, 130, 246, 0.7)"
              className="text-md font-medium"
            >
              Preparing to search knowledge base...
            </ShiningText>
          </div>
        );
      case "input-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(59, 130, 246, 0.7)"
              className="text-md font-medium"
            >
              Searching for: &ldquo;{part.input?.question || "information"}
              &rdquo;...
            </ShiningText>
          </div>
        );
      case "output-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(59, 130, 246, 0.7)"
              className="text-md font-medium"
            >
              Found relevant information in knowledge base
            </ShiningText>
          </div>
        );
      case "output-error":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(239, 68, 68, 0.7)"
              className="text-md font-medium"
            >
              Error: {part.errorText || "Failed to search knowledge base"}
            </ShiningText>
          </div>
        );
      default:
        return null;
    }
  }

  return null;
}
