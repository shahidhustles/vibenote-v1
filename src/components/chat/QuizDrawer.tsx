"use client";

import { X, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { generateQuiz, type QuizState } from "@/actions/generate-quiz";
import { useActionState, useState, useEffect } from "react";
import QuizContainer from "./quiz/QuizContainer";

interface QuizDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
  chatId: string;
}

const initialState: QuizState = {
  state: "idle",
  toastNotification: "",
  quiz: [],
};

export function QuizDrawer({
  open,
  onOpenChange,
  widthClass = "w-3/4 sm:max-w-sm",
  chatId,
}: QuizDrawerProps) {
  const [state, formAction, isPending] = useActionState(
    generateQuiz,
    initialState
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [showingResults, setShowingResults] = useState(false);

  useEffect(() => {
    if (state.state === "completed" && state.quiz.length > 0) {
      setShowQuiz(true);
    } else if (state.state === "idle") {
      setShowQuiz(false);
    }
  }, [state.state, state.quiz.length]);

  const resetQuiz = () => {
    setShowQuiz(false);
    setShowingResults(false);
  };

  const renderQuizContent = () => {
    if (state.state === "loading") {
      return (
        <div className="p-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Generating your quiz...</p>
        </div>
      );
    }

    if (state.state === "error") {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            {state.error || "An error occurred"}
          </p>
        </div>
      );
    }

    if (showQuiz && state.quiz.length > 0) {
      return (
        <QuizContainer
          questions={state.quiz}
          onResultsShow={setShowingResults}
        />
      );
    }

    return null;
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn("data-[vaul-drawer-direction=right]:w-auto", widthClass)}
      >
        <DrawerHeader className="flex flex-row items-center justify-between">
          <div>
            <DrawerTitle className="text-2xl font-bold text-blue-600">
              Quiz Section
            </DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              Generate Quiz for the learning you just did!!
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 p-6 overflow-y-auto">
          {(state.state === "idle" ||
            (state.state === "completed" && !showQuiz && !isPending)) && (
            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  Quiz Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter quiz title..."
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="questions"
                  className="text-sm font-medium text-gray-700"
                >
                  Number of Questions
                </Label>
                <Input
                  id="questions"
                  name="questions"
                  type="number"
                  placeholder="5"
                  min="1"
                  max="20"
                  className="w-full"
                  defaultValue="5"
                  required
                />
                <p className="text-xs text-gray-500">
                  Choose between 1-20 questions
                </p>
              </div>

              <input type="hidden" name="chatId" value={chatId} />

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating Quiz...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </form>
          )}

          {renderQuizContent()}
        </div>
        <DrawerFooter>
          {showQuiz && showingResults && (
            <Button onClick={resetQuiz} variant="outline" className="mb-2">
              Generate New Quiz
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
