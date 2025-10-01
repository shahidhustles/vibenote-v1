"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface WhiteboardProps {
  chatId: string;
}

export function Whiteboard({ chatId }: WhiteboardProps) {
  const persistenceKey = `whiteboard-${chatId}`;

  return (
    <div className="w-full h-full">
      <Tldraw persistenceKey={persistenceKey} />
    </div>
  );
}
