"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot, ChevronDown, ChevronUp } from "lucide-react";
import type { UIMessage } from "ai";
import Image from "next/image";
import ShiningText from "@/components/ui/shining-text";

// Helper function to convert LaTeX delimiters to remark-math format
function preprocessMath(text: string): string {
  return (
    text
      // Convert \( ... \) to $ ... $
      .replace(/\\\(/g, "$")
      .replace(/\\\)/g, "$")
      // Convert \[ ... \] to $$ ... $$
      .replace(/\\\[/g, "$$")
      .replace(/\\\]/g, "$$")
  );
}

// Helper function to detect and render Cloudinary URLs (images and videos) in text
function renderTextWithMedia(text: string): React.ReactNode {
  // Regex to match Cloudinary URLs on their own line
  const cloudinaryRegex = /^https:\/\/res\.cloudinary\.com\/[^\s]+$/gm;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = cloudinaryRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index).trim();
      if (beforeText) {
        parts.push(
          <div key={`text-${lastIndex}`} className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
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
              {preprocessMath(beforeText)}
            </ReactMarkdown>
          </div>
        );
      }
    }

    // Check if this is a video URL (contains .mp4, .webm, or video/ in the path)
    const isVideoUrl = /\.(mp4|webm|mov)(\?|$)|\/video\//.test(match[0]);

    if (isVideoUrl) {
      // Add the video player - simple like library page
      parts.push(
        <div key={`video-${match.index}`} className="my-4">
          <video
            src={match[0]}
            controls
            className="w-full h-auto rounded-lg"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      // Add the image
      parts.push(
        <div key={`image-${match.index}`} className="my-4">
          <div className="relative rounded-lg overflow-hidden border border-pink-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <Image
              src={match[0]}
              alt="Retrieved from documents"
              width={600}
              height={400}
              className="w-full h-auto object-contain"
              unoptimized
            />
          </div>
        </div>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push(
        <div key={`text-${lastIndex}`} className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
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
                <td className="border border-gray-300 px-3 py-2">{children}</td>
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
                <p className="mb-2 text-gray-900 leading-relaxed">{children}</p>
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
            {preprocessMath(remainingText)}
          </ReactMarkdown>
        </div>
      );
    }
  }

  // If no URLs found, render as normal markdown
  if (parts.length === 0) {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
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
              <td className="border border-gray-300 px-3 py-2">{children}</td>
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
              <p className="mb-2 text-gray-900 leading-relaxed">{children}</p>
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
            li: ({ children }) => <li className="text-gray-900">{children}</li>,
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
          {preprocessMath(text)}
        </ReactMarkdown>
      </div>
    );
  }

  return <>{parts}</>;
}

interface MessageBubbleProps {
  message: UIMessage;
  userAvatar?: string;
  userName?: string;
  chatId?: string;
}

export function MessageBubble({
  message,
  userAvatar,
  userName,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Debug: Log message data
  console.log("[MessageBubble] Rendering message:", {
    id: message.id,
    role: message.role,
    hasMetadata: !!message.metadata,
    metadata: message.metadata,
  });

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
                    renderTextWithMedia(part.text)
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

            // Handle consultAryabhatta tool calls
            case "tool-consultAryabhatta":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part, "consultAryabhatta")}
                </div>
              );

            // Handle retrieveMorphik tool calls
            case "tool-retrieveMorphik":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part, "retrieveMorphik", message.id)}
                </div>
              );

            // Handle generateVideo tool calls
            case "tool-generateVideo":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part, "generateVideo", message.id)}
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
function renderToolCall(part: any, toolName: string, messageId?: string) {
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

  if (toolName === "consultAryabhatta") {
    switch (part.state) {
      case "input-streaming":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(16, 185, 129, 0.7)"
              className="text-md font-medium"
            >
              Consulting Aryabhatta
            </ShiningText>
          </div>
        );
      case "input-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(16, 185, 129, 0.7)"
              className="text-md font-medium"
            >
              Analyzing: &ldquo;
              {part.input?.query?.substring(0, 50) || "mathematical query"}
              {part.input?.query?.length > 50 ? "..." : ""}
              &rdquo;
            </ShiningText>
          </div>
        );
      case "output-available":
        return <AryabhattaOutputDisplay key={toolCallId} part={part} />;
      case "output-error":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(239, 68, 68, 0.7)"
              className="text-md font-medium"
            >
              🔬 Error: {part.errorText || "Failed to consult Aryabhatta"}
            </ShiningText>
          </div>
        );
      default:
        return null;
    }
  }

  if (toolName === "retrieveMorphik") {
    switch (part.state) {
      case "input-streaming":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(236, 72, 153, 0.7)"
              className="text-md font-medium"
            >
              📚 Searching your documents...
            </ShiningText>
          </div>
        );
      case "input-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(236, 72, 153, 0.7)"
              className="text-md font-medium"
            >
              📚 Searching for: &ldquo;
              {part.input?.query?.substring(0, 50) || "information"}
              {part.input?.query?.length > 50 ? "..." : ""}
              &rdquo;
            </ShiningText>
          </div>
        );
      case "output-available":
        return (
          <MorphikOutputDisplay
            key={toolCallId}
            part={part}
            messageId={messageId}
          />
        );
      case "output-error":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(239, 68, 68, 0.7)"
              className="text-md font-medium"
            >
              📚 Error: {part.errorText || "Failed to retrieve from library"}
            </ShiningText>
          </div>
        );
      default:
        return null;
    }
  }

  if (toolName === "generateVideo") {
    switch (part.state) {
      case "input-streaming":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(168, 85, 247, 0.7)"
              className="text-md font-medium"
            >
              🎬 Generating video...
            </ShiningText>
          </div>
        );
      case "input-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(168, 85, 247, 0.7)"
              className="text-md font-medium"
            >
              🎬 Creating video for: &ldquo;
              {part.input?.topic?.substring(0, 50) || "educational content"}
              {part.input?.topic?.length > 50 ? "..." : ""}
              &rdquo;
            </ShiningText>
          </div>
        );
      case "output-available":
        return (
          <div key={toolCallId} className="text-md">
            <ShiningText
              duration="2s"
              textColor="rgba(168, 85, 247, 0.7)"
              className="text-md font-medium"
            >
              🎬 Video generated successfully
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
              🎬 Error: {part.errorText || "Failed to generate video"}
            </ShiningText>
          </div>
        );
      default:
        return null;
    }
  }

  return null;
}

// Special component for Aryabhatta output with dropdown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AryabhattaOutputDisplay({ part }: { part: any }) {
  const [showRawResponse, setShowRawResponse] = useState(false);

  return (
    <div className="space-y-2">
      {/* Main status with shining text */}
      <div className="text-md">
        <ShiningText
          duration="2s"
          textColor="rgba(16, 185, 129, 0.7)"
          className="text-md font-medium"
        >
          Aryabhatta analysis complete
        </ShiningText>
      </div>

      {/* Dropdown toggle */}
      <button
        onClick={() => setShowRawResponse(!showRawResponse)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
      >
        {showRawResponse ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        View raw Aryabhatta response
      </button>

      {/* Collapsible raw response */}
      {showRawResponse && (
        <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
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
                p: ({ children }) => (
                  <p className="mb-2 text-gray-700 leading-relaxed">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2 text-gray-800">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-md font-semibold mb-2 text-gray-700">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mb-1 text-gray-600">
                    {children}
                  </h3>
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
                  <li className="text-gray-700">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-800">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-600">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-400 pl-4 italic text-gray-600 mb-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {preprocessMath(part.output?.response || "No response available")}
            </ReactMarkdown>
          </div>
          {part.output?.error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {part.output.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Special component for Morphik output with dropdown
// Note: Images are saved to Convex automatically by the API route's onFinish callback
// and will appear below the message via Convex realtime updates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MorphikOutputDisplay({ part }: { part: any; messageId?: string }) {
  const [showContext, setShowContext] = useState(false);

  const imageCount = part.output?.imageCount || 0;
  const textChunkCount = part.output?.textChunkCount || 0;

  return (
    <div className="space-y-2">
      {/* Main status with shining text */}
      <div className="text-md">
        <ShiningText
          duration="2s"
          textColor="rgba(236, 72, 153, 0.7)"
          className="text-md font-medium"
        >
          📚 Found {imageCount} image{imageCount !== 1 ? "s" : ""} and{" "}
          {textChunkCount} text chunk{textChunkCount !== 1 ? "s" : ""} from your
          library
        </ShiningText>
      </div>

      {/* Dropdown toggle for context */}
      {part.output?.context && (
        <>
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 transition-colors"
          >
            {showContext ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            View retrieved context from documents
          </button>

          {/* Collapsible context */}
          {showContext && (
            <div className="mt-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
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
                    p: ({ children }) => (
                      <p className="mb-2 text-gray-700 leading-relaxed">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-bold mb-2 text-gray-800">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-md font-semibold mb-2 text-gray-700">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">
                        {children}
                      </h3>
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
                      <li className="text-gray-700">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-800">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-600">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-pink-400 pl-4 italic text-gray-600 mb-2">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {preprocessMath(
                    part.output?.context || "No context available"
                  )}
                </ReactMarkdown>
              </div>
              {part.output?.error && (
                <div className="mt-2 text-xs text-red-600">
                  Error: {part.output.error}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
