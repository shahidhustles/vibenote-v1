"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type FlashcardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: Array<{
    question: string;
    answer: string;
    hint?: string;
  }>;
};

const FlashcardDialog = ({
  open,
  onOpenChange,
  flashcards,
}: FlashcardDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    onOpenChange(false);
  };

  if (!currentCard) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] bg-transparent backdrop-blur-xl border-none p-8 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Flashcards Study Session</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-white text-center">
              <p className="text-xl">No flashcards available</p>
              <p className="text-gray-400 mt-2">
                Generate flashcards to start studying!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] bg-transparent backdrop-blur-xl border-none p-8 shadow-none">
        <VisuallyHidden>
          <DialogTitle>Flashcards Study Session</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="w-full max-w-[600px] relative">
            {/* Flashcard */}
            <div
              className="relative w-full h-[400px] cursor-pointer group"
              onClick={flipCard}
              style={{ perspective: "1000px" }}
            >
              <div
                className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-gpu ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Front of card */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl border border-white/10 flex flex-col p-8"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold text-white mb-6">
                        {currentCard.question}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-gray-200 opacity-75">
                        <RotateCw className="w-4 h-4" />
                        <p className="text-sm">Click to reveal answer</p>
                      </div>
                    </div>
                  </div>

                  {currentCard.hint && (
                    <div className="mt-auto pt-4 border-t border-white/20">
                      <p className="text-sm text-gray-200 opacity-75 text-center">
                        💡 Hint: {currentCard.hint}
                      </p>
                    </div>
                  )}
                </div>

                {/* Back of card */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center p-8 rotate-y-180"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-white">
                      {currentCard.answer}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-8">
              <Button
                onClick={prevCard}
                disabled={currentIndex === 0}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-white/80 text-sm">
                  {currentIndex + 1} of {flashcards.length}
                </span>

                {/* Progress bar */}
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <Button
                onClick={nextCard}
                disabled={currentIndex === flashcards.length - 1}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardDialog;
