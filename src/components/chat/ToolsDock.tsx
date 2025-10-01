"use client";

import { useState } from "react";
import { Presentation, Brain, Layers } from "lucide-react";
import { WhiteboardDrawer } from "./WhiteboardDrawer";
import { QuizDrawer } from "./QuizDrawer";
import { FlashcardsDrawer } from "./FlashcardsDrawer";

interface ToolsDockProps {
  position?: "bottom" | "right";
}

type DrawerType = "whiteboard" | "quiz" | "flashcards" | null;

export function ToolsDock({ position = "right" }: ToolsDockProps) {
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);

  const handleDockClick = (type: DrawerType) => {
    setOpenDrawer(type);
  };

  const dockItems = [
    {
      title: "Whiteboard",
      icon: <Presentation className="h-full w-full text-purple-600" />,
      onClick: () => handleDockClick("whiteboard"),
    },
    {
      title: "Quiz",
      icon: <Brain className="h-full w-full text-blue-600" />,
      onClick: () => handleDockClick("quiz"),
    },
    {
      title: "Flashcards",
      icon: <Layers className="h-full w-full text-cyan-600" />,
      onClick: () => handleDockClick("flashcards"),
    },
  ];

  const DockButtons = () => (
    <div
      className={`flex gap-4 ${
        position === "bottom" ? "flex-row" : "flex-col"
      }`}
    >
      {dockItems.map((item) => (
        <button
          key={item.title}
          onClick={item.onClick}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 hover:from-purple-200 hover:via-blue-200 hover:to-cyan-200 border border-purple-200 transition-all duration-200 hover:scale-110"
          title={item.title}
        >
          <div className="h-6 w-6">{item.icon}</div>

          {/* Tooltip */}
          <span
            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm border border-purple-200 px-2 py-1 rounded-md text-xs whitespace-nowrap text-gray-900 pointer-events-none
            data-[position=bottom]:top-full data-[position=bottom]:mt-2
            data-[position=right]:-left-2 data-[position=right]:translate-x-[-100%]"
            data-position={position}
          >
            {item.title}
          </span>
        </button>
      ))}
    </div>
  );

  const renderDrawers = () => (
    <>
      <WhiteboardDrawer
        open={openDrawer === "whiteboard"}
        onOpenChange={(open) => !open && setOpenDrawer(null)}
        widthClass="w-1/4 min-w-[600px]"
      />
      <QuizDrawer
        open={openDrawer === "quiz"}
        onOpenChange={(open) => !open && setOpenDrawer(null)}
        widthClass="w-3/4 sm:max-w-sm"
      />
      <FlashcardsDrawer
        open={openDrawer === "flashcards"}
        onOpenChange={(open) => !open && setOpenDrawer(null)}
        widthClass="w-3/4 sm:max-w-sm"
      />
    </>
  );

  if (position === "bottom") {
    return (
      <>
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl px-4 py-3">
          <DockButtons />
        </div>
        {renderDrawers()}
      </>
    );
  }

  // position === "right"
  return (
    <>
      <div className="fixed top-1/2 right-8 -translate-y-1/2 z-50 bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl px-3 py-4">
        <DockButtons />
      </div>
      {renderDrawers()}
    </>
  );
}
