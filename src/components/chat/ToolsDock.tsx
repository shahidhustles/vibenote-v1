"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Presentation, Brain, Layers } from "lucide-react";
import { WhiteboardDrawer } from "./WhiteboardDrawer";
import { Whiteboard, WhiteboardRef } from "./Whiteboard";
import { QuizDrawer } from "./QuizDrawer";
import { FlashcardsDrawer } from "./FlashcardsDrawer";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

interface ToolsDockProps {
  position?: "bottom" | "right";
  chatId: string;
}

type DrawerType = "whiteboard" | "quiz" | "flashcards" | null;

export interface ToolsDockRef {
  captureWhiteboard: () => Promise<string | null>;
}

export const ToolsDock = forwardRef<ToolsDockRef, ToolsDockProps>(
  ({ position = "right", chatId }, ref) => {
    const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
    const whiteboardRef = useRef<WhiteboardRef>(null);

    const captureWhiteboard = useCallback(async () => {
      if (!whiteboardRef.current) {
        return null;
      }
      return await whiteboardRef.current.captureSnapshot();
    }, []);

    useImperativeHandle(ref, () => ({
      captureWhiteboard,
    }));

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

    const DockButtons = () => {
      const mouseY = useMotionValue(Infinity);
      const mouseX = useMotionValue(Infinity);

      return (
        <motion.div
          onMouseMove={(e) => {
            if (position === "bottom") {
              mouseX.set(e.pageX);
            } else {
              mouseY.set(e.pageY);
            }
          }}
          onMouseLeave={() => {
            mouseX.set(Infinity);
            mouseY.set(Infinity);
          }}
          className={cn(
            "flex gap-4",
            position === "bottom" ? "flex-row" : "flex-col"
          )}
        >
          {dockItems.map((item) => (
            <DockIcon
              key={item.title}
              mouseX={mouseX}
              mouseY={mouseY}
              position={position}
              {...item}
            />
          ))}
        </motion.div>
      );
    };

    const DockIcon = ({
      mouseX,
      mouseY,
      title,
      icon,
      onClick,
      position,
    }: {
      mouseX: MotionValue;
      mouseY: MotionValue;
      title: string;
      icon: React.ReactNode;
      onClick: () => void;
      position: "bottom" | "right";
    }) => {
      const ref = useRef<HTMLButtonElement>(null);
      const [hovered, setHovered] = useState(false);

      const distance = useTransform(
        position === "bottom" ? mouseX : mouseY,
        (val) => {
          const bounds = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
          const center =
            position === "bottom"
              ? bounds.x + bounds.width / 2
              : bounds.y + bounds.height / 2;
          return val - center;
        }
      );

      const widthTransform = useTransform(
        distance,
        [-150, 0, 150],
        [40, 80, 40]
      );
      const heightTransform = useTransform(
        distance,
        [-150, 0, 150],
        [40, 80, 40]
      );

      const width = useSpring(widthTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });
      const height = useSpring(heightTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });

      return (
        <motion.button
          ref={ref}
          style={{ width, height }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onClick}
          className="relative flex aspect-square items-center justify-center rounded-full bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 hover:from-purple-200 hover:via-blue-200 hover:to-cyan-200 border border-purple-200"
        >
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: position === "bottom" ? 10 : 0,
                  x: position === "right" ? 10 : "-50%",
                }}
                animate={{
                  opacity: 1,
                  y: position === "bottom" ? 0 : 0,
                  x: position === "bottom" ? "-50%" : 0,
                }}
                exit={{
                  opacity: 0,
                  y: position === "bottom" ? 2 : 0,
                  x: position === "bottom" ? "-50%" : 2,
                }}
                className={cn(
                  "absolute whitespace-nowrap rounded-md border border-purple-200 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs text-gray-900",
                  position === "bottom"
                    ? "-top-8 left-1/2"
                    : "right-full mr-2 top-1/2 -translate-y-1/2"
                )}
              >
                {title}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            style={{
              width: useSpring(
                useTransform(distance, [-150, 0, 150], [20, 40, 20]),
                {
                  mass: 0.1,
                  stiffness: 150,
                  damping: 12,
                }
              ),
              height: useSpring(
                useTransform(distance, [-150, 0, 150], [20, 40, 20]),
                {
                  mass: 0.1,
                  stiffness: 150,
                  damping: 12,
                }
              ),
            }}
            className="flex items-center justify-center"
          >
            {icon}
          </motion.div>
        </motion.button>
      );
    };

    const renderDrawers = () => (
      <>
        {/* Always render Whiteboard (off-screen) to keep ref available */}
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            width: "800px",
            height: "600px",
            pointerEvents: "none",
          }}
        >
          <Whiteboard ref={whiteboardRef} chatId={chatId} />
        </div>

        <WhiteboardDrawer
          open={openDrawer === "whiteboard"}
          onOpenChange={(open) => !open && setOpenDrawer(null)}
          widthClass="w-1/4 min-w-[600px]"
          chatId={chatId}
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
);

ToolsDock.displayName = "ToolsDock";
