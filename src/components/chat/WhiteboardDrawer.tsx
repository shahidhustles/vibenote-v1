"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Whiteboard } from "./Whiteboard";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface WhiteboardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
  chatId: string;
}

export function WhiteboardDrawer({
  open,
  onOpenChange,
  widthClass = "w-3/4 sm:max-w-sm",
  chatId,
}: WhiteboardDrawerProps) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "data-[vaul-drawer-direction=right]:w-auto h-screen",
          widthClass
        )}
      >
        <VisuallyHidden>
          <DrawerTitle>Whiteboard</DrawerTitle>
        </VisuallyHidden>
        <div
          className="flex-1 overflow-hidden h-full"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Whiteboard chatId={chatId} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
