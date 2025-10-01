"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Zap } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  onSendMessage?: (message: string, expertMode?: boolean) => void;
  isMainPage?: boolean;
  onExpertMode?: () => void;
}

export function ChatInput({
  onSendMessage,
  isMainPage = false,
  onExpertMode,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [expertMode, setExpertMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !onSendMessage) return;

    // Pass both message and expert mode state
    onSendMessage(message, expertMode);
    setMessage("");
  };

  const toggleExpertMode = () => {
    setExpertMode(!expertMode);
    onExpertMode?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enter will create a new line (default behavior)
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Chat Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-300/70">
          {/* Text Input */}
          <div className="flex-1 relative">
            <TextareaAutosize
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about educational content, learning concepts, knowledge management..."
              className={`w-full bg-transparent text-gray-900  p-4 pr-12 resize-none border-0 outline-none max-h-32 ${
                isMainPage ? "min-h-[96px]" : "min-h-[32px]"
              }`}
              minRows={1}
              maxRows={4}
            />
          </div>

          {/* Expert Mode Button */}
          <div className="p-2">
            <Button
              type="button"
              size="sm"
              variant={expertMode ? "default" : "outline"}
              onClick={toggleExpertMode}
              className={`rounded-lg p-2 transition-all duration-200 mr-2 ${
                expertMode
                  ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-500 text-white shadow-md"
                  : "border-purple-400 text-purple-600 hover:bg-purple-50 hover:border-purple-500"
              }`}
              title="Toggle Expert Mode - Enhanced AI analysis for complex topics"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>

          {/* Send Button */}
          <div className="p-2">
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-500 text-white rounded-lg p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom Helper Text */}
        <div className="text-xs mt-2 text-center drop-shadow-sm">
          {expertMode ? (
            <span className="text-slate-700 font-medium">
              Expert Mode Active - Enhanced AI analysis for complex educational
              topics and advanced learning
            </span>
          ) : (
            <span className="text-slate-700">
              VibeNote can help with learning, knowledge management, educational
              content analysis, and study assistance.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
