"use client";

import React from "react";
import ChatHeader from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";

const GradientBackground = ({
  className,
  gradientFrom = "#fff",
  gradientTo = "#63e",
  gradientSize = "125% 125%",
  gradientPosition = "50% 10%",
  gradientStop = "40%",
}: {
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientSize?: string;
  gradientPosition?: string;
  gradientStop?: string;
}) => {
  return (
    <div
      className={cn("absolute inset-0 w-full h-full -z-10 bg-white", className)}
      style={{
        background: `radial-gradient(${gradientSize} at ${gradientPosition}, ${gradientFrom} ${gradientStop}, ${gradientTo} 100%)`,
      }}
    />
  );
};

export default function ChatPage() {
  const router = useRouter();
  const { user } = useUser();

  const handleSendMessage = async (
    message: string,
    aryabhattaMode: boolean = false
  ) => {
    if (!user) return;

    try {
      // Generate a unique chat ID on the client side
      const chatId = nanoid();

      // Redirect with the generated chat ID and initial message
      const encodedMessage = encodeURIComponent(message);
      const aryabhattaModeParam = aryabhattaMode ? "&aryabhattaMode=true" : "";
      router.push(
        `/chat/${chatId}?initialMessage=${encodedMessage}${aryabhattaModeParam}`
      );
    } catch (error) {
      console.error("Failed to navigate to chat:", error);
    }
  };

  return (
    <div className="relative h-full bg-white overflow-hidden">
      {/* Gradient Background */}
      <GradientBackground
        gradientFrom="rgba(224,242,254,1)"
        gradientTo="rgba(233,213,255,0.8)"
        gradientSize="125% 125%"
        gradientPosition="50% 10%"
        gradientStop="40%"
        className="z-0 pointer-events-none"
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex-none pt-8 mt-25">
          <ChatHeader />
        </div>

        {/* Spacer to center the input */}
        <div className="flex-1 flex items-start justify-center mt-10">
          <ChatInput onSendMessage={handleSendMessage} isMainPage={true} />
        </div>
      </div>
    </div>
  );
}
