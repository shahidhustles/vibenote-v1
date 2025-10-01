"use client";

import { ToolsDock } from "@/components/chat/ToolsDock";
import { useParams } from "next/navigation";

export default function ChatIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const chatId = params.chatId as string;

  return (
    <div className="relative h-full">
      {children}
      <ToolsDock position="right" chatId={chatId} />
    </div>
  );
}
