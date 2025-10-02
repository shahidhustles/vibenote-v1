"use client";

import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useActionState, useEffect, useState } from "react";
import { generateFlashcards } from "@/actions/generate-flashcards";
import { useQuery } from "convex/react";
import FlashcardDialog from "./FlashcardDialog";
import { api } from "../../../convex/_generated/api";

interface FlashcardsDrawerProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
}

export function FlashcardsDrawer({
  chatId,
  open,
  onOpenChange,
  widthClass = "w-3/4 sm:max-w-sm",
}: FlashcardsDrawerProps) {
  const [state, formAction, isPending] = useActionState(generateFlashcards, {
    state: "idle",
  });
  const [showFlashcards, setShowFlashcards] = useState(false);

  const flashcardDeck = useQuery(api.flashcards.getFlashcardDeck, { chatId });

  useEffect(() => {
    if (state.state === "completed") {
      const timer = setTimeout(() => {
        if (flashcardDeck?.flashcards && flashcardDeck.flashcards.length > 0) {
          setShowFlashcards(true);
          onOpenChange(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.state, flashcardDeck, onOpenChange]);

  return (
    <>
      <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn(
            "data-[vaul-drawer-direction=right]:w-auto",
            widthClass
          )}
        >
          <DrawerHeader className="flex flex-row items-center justify-between">
            <div>
              <DrawerTitle className="text-2xl font-bold text-cyan-600">
                Flashcards
              </DrawerTitle>
              <DrawerDescription>
                Generate flashcards to help reinforce your learning!
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 p-6 overflow-y-auto">
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="chatId" value={chatId} />

              <div className="space-y-2">
                <Label
                  htmlFor="numFlashcards"
                  className="text-sm font-medium text-gray-700"
                >
                  Number of Flashcards
                </Label>
                <Input
                  id="numFlashcards"
                  name="numFlashcards"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Choose between 1-10 flashcards to generate
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="enableReminder"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Reminder
                  </Label>
                  <Switch id="enableReminder" name="enableReminder" />
                </div>
                <p className="text-xs text-gray-500">
                  Save calendar reminders in your Google Calendar to review
                  these flashcards using spaced repetition (3, 5, 7, 9 days)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="enableHints"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Hints
                  </Label>
                  <Switch id="enableHints" name="enableHints" />
                </div>
                <p className="text-xs text-gray-500">
                  Include helpful hints on flashcards to guide your learning
                  process
                </p>
              </div>

              {state.state === "loading" && (
                <div className="text-blue-600 text-sm">
                  Generating flashcards...
                </div>
              )}
              {state.state === "completed" && (
                <div className="text-green-600 text-sm">{state.message}</div>
              )}
              {state.state === "error" && (
                <div className="text-red-600 text-sm">{state.message}</div>
              )}

              {flashcardDeck?.flashcards &&
                flashcardDeck.flashcards.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => setShowFlashcards(true)}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    View Existing Flashcards
                  </Button>
                )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50"
              >
                {isPending ? "Generating..." : "Generate Flashcards"}
              </Button>
            </form>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <FlashcardDialog
        open={showFlashcards}
        onOpenChange={setShowFlashcards}
        flashcards={flashcardDeck?.flashcards || []}
      />
    </>
  );
}
