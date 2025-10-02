"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Send, BookOpen } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  onSendMessage?: (
    message: string,
    aryabhattaMode?: boolean,
    whiteboardSnapshot?: string,
    libraryMode?: boolean
  ) => void;
  isMainPage?: boolean;
  onAryabhattaMode?: () => void;
  onLibraryMode?: () => void;
  onCaptureWhiteboard?: () => Promise<string | null>;
}

interface ContextMenuItem {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export function ChatInput({
  onSendMessage,
  isMainPage = false,
  onAryabhattaMode,
  onLibraryMode,
  onCaptureWhiteboard,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [aryabhattaMode, setAryabhattaMode] = useState(false);
  const [libraryMode, setLibraryMode] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [whiteboardAttached, setWhiteboardAttached] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: "whiteboard",
      label: "Whiteboard",
      description: "Include current whiteboard snapshot in your message",
      icon: "🎨",
    },
  ];

  // Log component mount and props
  useEffect(() => {
    console.log("[ChatInput] Component mounted/updated");
    console.log(
      "[ChatInput] Props - onCaptureWhiteboard:",
      !!onCaptureWhiteboard
    );
    console.log("[ChatInput] Props - onSendMessage:", !!onSendMessage);
    console.log("[ChatInput] Props - isMainPage:", isMainPage);
  }, [onCaptureWhiteboard, onSendMessage, isMainPage]);

  // Log when whiteboard attachment state changes
  useEffect(() => {
    console.log(
      "[ChatInput] whiteboardAttached state changed to:",
      whiteboardAttached
    );
  }, [whiteboardAttached]);

  // Log when showContextMenu state changes
  useEffect(() => {
    console.log(
      "[ChatInput] showContextMenu state changed to:",
      showContextMenu
    );
  }, [showContextMenu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !onSendMessage) return;

    console.log(
      "[ChatInput] Submitting message, whiteboardAttached:",
      whiteboardAttached
    );
    console.log(
      "[ChatInput] onCaptureWhiteboard available:",
      !!onCaptureWhiteboard
    );
    let whiteboardSnapshot: string | null = null;

    // Capture whiteboard snapshot if attached
    if (whiteboardAttached && onCaptureWhiteboard) {
      console.log("[ChatInput] Capturing whiteboard snapshot...");
      whiteboardSnapshot = await onCaptureWhiteboard();

      if (whiteboardSnapshot) {
        console.log(
          "[ChatInput] Whiteboard snapshot captured successfully, length:",
          whiteboardSnapshot.length
        );
      } else {
        console.warn("[ChatInput] Whiteboard snapshot capture returned null");
      }
    }

    // Remove @Whiteboard tag from message before sending
    const cleanMessage = message.replace(/@Whiteboard\s*/g, "").trim();

    // Pass message, aryabhatta mode, library mode, and optional whiteboard snapshot
    console.log(
      "[ChatInput] Sending message with snapshot:",
      !!whiteboardSnapshot
    );
    onSendMessage(
      cleanMessage,
      aryabhattaMode,
      whiteboardSnapshot || undefined,
      libraryMode
    );
    setMessage("");
    setWhiteboardAttached(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check if message contains @Whiteboard tag
    if (value.includes("@Whiteboard")) {
      setWhiteboardAttached(true);
    } else {
      setWhiteboardAttached(false);
    }

    // Check if user typed '@' at the end
    if (value.endsWith("@")) {
      // Get cursor position to show context menu
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      setContextMenuPosition({
        x: rect.left,
        y: rect.top - 100, // Position above the input
      });
      setShowContextMenu(true);
    } else {
      setShowContextMenu(false);
    }
  };

  const handleContextMenuSelect = (itemId: string) => {
    console.log("[ChatInput] Context menu item selected:", itemId);
    if (itemId === "whiteboard") {
      // Replace '@' with '@Whiteboard '
      setMessage(message.slice(0, -1) + "@Whiteboard ");
      setWhiteboardAttached(true);
      setShowContextMenu(false);
      console.log(
        "[ChatInput] Whiteboard attached! whiteboardAttached set to true"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Close context menu on Escape
    if (e.key === "Escape" && showContextMenu) {
      setShowContextMenu(false);
      setMessage(message.slice(0, -1)); // Remove the '@'
    }
    // Shift+Enter will create a new line (default behavior)
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
        // Remove trailing '@' if context menu was open
        if (message.endsWith("@")) {
          setMessage(message.slice(0, -1));
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu, message]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="absolute z-50 bg-white border border-purple-200 rounded-lg shadow-xl p-2 mb-2"
          style={{
            left: `${contextMenuPosition.x}px`,
            bottom: "80px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleContextMenuSelect(item.id)}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors flex items-start gap-2"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <style jsx>{`
          .whiteboard-textarea {
            background-image: linear-gradient(
              to right,
              transparent 0%,
              transparent 100%
            );
          }
          .whiteboard-textarea::before {
            content: attr(data-highlighted);
            position: absolute;
            pointer-events: none;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: transparent;
          }
        `}</style>

        <div className="relative flex items-end bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-300/70">
          {/* Text Input */}
          <div className="flex-1 relative">
            {/* Highlighted text layer */}
            {whiteboardAttached && (
              <div
                className={`absolute inset-0 p-4 pr-12 pointer-events-none whitespace-pre-wrap break-words text-gray-900 ${
                  isMainPage ? "min-h-[96px]" : "min-h-[32px]"
                }`}
                style={{ zIndex: 1 }}
              >
                {message.split(/(@Whiteboard)/g).map((part, i) =>
                  part === "@Whiteboard" ? (
                    <span
                      key={i}
                      className="font-semibold"
                      style={{ color: "#ec4899" }}
                    >
                      {part}
                    </span>
                  ) : (
                    <span key={i} style={{ color: "transparent" }}>
                      {part}
                    </span>
                  )
                )}
              </div>
            )}
            <TextareaAutosize
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about educational content, learning concepts, knowledge management... (Type @ for context)"
              className={`w-full bg-transparent text-gray-900 p-4 pr-12 resize-none border-0 outline-none max-h-32 relative scrollbar-hide ${
                isMainPage ? "min-h-[96px]" : "min-h-[32px]"
              }`}
              style={
                whiteboardAttached
                  ? { zIndex: 2, color: "transparent", caretColor: "#111827" }
                  : {}
              }
              minRows={1}
              maxRows={4}
            />
            {/* Actual text overlay for non-@Whiteboard text */}
            {whiteboardAttached && (
              <div
                className={`absolute inset-0 p-4 pr-12 pointer-events-none whitespace-pre-wrap break-words text-gray-900 ${
                  isMainPage ? "min-h-[96px]" : "min-h-[32px]"
                }`}
                style={{ zIndex: 3 }}
              >
                {message.split(/(@Whiteboard)/g).map((part, i) =>
                  part === "@Whiteboard" ? (
                    <span key={i} style={{ color: "transparent" }}>
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
            )}
          </div>

          {/* Library Mode Toggle - Inline with Send Button */}
          <div className="flex items-center p-2">
            <Toggle
              pressed={libraryMode}
              onPressedChange={(pressed) => {
                setLibraryMode(pressed);
                onLibraryMode?.();
              }}
              variant="outline"
              size="sm"
              className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:via-blue-500 data-[state=on]:to-cyan-400 data-[state=on]:text-white data-[state=on]:border-transparent data-[state=on]:shadow-md h-9"
              aria-label="Toggle Library Mode"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Library Mode
            </Toggle>
          </div>

          {/* Send Button */}
          <div className="p-2">
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-500 text-white rounded-lg p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg h-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Aryabhatta Mode Toggle - Below chat container, aligned to the right */}
        <div className="flex items-center justify-end space-x-2 mt-3">
          <Switch
            id="aryabhatta-mode"
            checked={aryabhattaMode}
            onCheckedChange={(checked) => {
              setAryabhattaMode(checked);
              onAryabhattaMode?.();
            }}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
          />
          <label
            htmlFor="aryabhatta-mode"
            className="text-sm font-medium text-slate-700 cursor-pointer select-none"
          >
            Aryabhatta Mode
          </label>
        </div>

        {/* Bottom Helper Text */}
        <div className="text-xs mt-2 text-center drop-shadow-sm">
          {aryabhattaMode && libraryMode ? (
            <span className="text-slate-700 font-medium">
              Aryabhatta Mode & Library Mode Active - Enhanced mathematical
              analysis with document retrieval
            </span>
          ) : aryabhattaMode ? (
            <span className="text-slate-700 font-medium">
              Aryabhatta Mode Active - Enhanced mathematical and physics
              analysis using specialized AI models
            </span>
          ) : libraryMode ? (
            <span className="text-slate-700 font-medium">
              Library Mode Active - AI can search and retrieve context from your
              uploaded documents
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
