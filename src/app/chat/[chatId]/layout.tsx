"use client";

import { ToolsDock } from "@/components/chat/ToolsDock";

export default function ChatIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full">
      {children}
      <ToolsDock position="right" />
    </div>
  );
}
