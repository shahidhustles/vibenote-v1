"use client";

import { ToolsDock, ToolsDockRef } from "@/components/chat/ToolsDock";
import { useParams } from "next/navigation";
import { createContext, useRef, useContext, ReactNode } from "react";

// Create context for the ToolsDock ref
interface ToolsDockContextType {
  toolsDockRef: React.RefObject<ToolsDockRef | null>;
}

const ToolsDockContext = createContext<ToolsDockContextType | null>(null);

export function useToolsDock() {
  const context = useContext(ToolsDockContext);
  return context?.toolsDockRef.current || null;
}

export default function ChatIdLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const chatId = params.chatId as string;
  const toolsDockRef = useRef<ToolsDockRef>(null);

  return (
    <ToolsDockContext.Provider value={{ toolsDockRef }}>
      <div className="relative h-full">
        {children}
        <ToolsDock ref={toolsDockRef} position="right" chatId={chatId} />
      </div>
    </ToolsDockContext.Provider>
  );
}
