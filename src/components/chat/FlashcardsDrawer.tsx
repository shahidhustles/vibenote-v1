"use client";

import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface FlashcardsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
}

export function FlashcardsDrawer({
  open,
  onOpenChange,
  widthClass = "w-3/4 sm:max-w-sm",
}: FlashcardsDrawerProps) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={widthClass}>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle className="text-2xl font-bold text-cyan-600">
            Flashcards Page
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 p-6">
          <p className="text-gray-600">Flashcards content will go here...</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
