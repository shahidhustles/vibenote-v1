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

interface QuizDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
}

export function QuizDrawer({
  open,
  onOpenChange,
  widthClass = "w-3/4 sm:max-w-sm",
}: QuizDrawerProps) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={widthClass}>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle className="text-2xl font-bold text-blue-600">
            Quiz Page
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 p-6">
          <p className="text-gray-600">Quiz content will go here...</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
