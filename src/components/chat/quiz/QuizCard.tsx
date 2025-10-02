"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

export type QuizQuestion = {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: "a" | "b" | "c" | "d";
  solution: string;
};

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  onAnswer: (selectedOption: "a" | "b" | "c" | "d", isCorrect: boolean) => void;
}

const QuizCard = ({ question, questionNumber, onAnswer }: QuizCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [question]);

  const handleOptionSelect = (option: "a" | "b" | "c" | "d") => {
    if (showResult) return;

    setSelectedOption(option);
    const isCorrect = option === question.correctAnswer;
    setShowResult(true);
    onAnswer(option, isCorrect);
  };

  const getOptionStyle = (option: "a" | "b" | "c" | "d") => {
    if (!showResult) {
      return selectedOption === option
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300";
    }

    if (option === question.correctAnswer) {
      return "border-green-500 bg-green-50 text-green-700";
    }

    if (option === selectedOption && option !== question.correctAnswer) {
      return "border-red-500 bg-red-50 text-red-700";
    }

    return "border-gray-200 bg-white text-gray-600";
  };

  const getOptionIcon = (option: "a" | "b" | "c" | "d") => {
    // Only show icons after user has answered
    if (!showResult) {
      return null;
    }

    if (option === question.correctAnswer) {
      return <Check className="h-4 w-4 text-green-600" />;
    }

    if (option === selectedOption && option !== question.correctAnswer) {
      return <X className="h-4 w-4 text-red-600" />;
    }

    return null;
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h4 className="font-medium mb-4 text-lg">
        {questionNumber}. {question.question}
      </h4>

      <div className="space-y-3 mb-4">
        {Object.entries(question.options).map(([key, value]) => (
          <div
            key={key}
            onClick={() => handleOptionSelect(key as "a" | "b" | "c" | "d")}
            className={`p-3 border rounded-lg transition-all duration-200 flex items-center justify-between cursor-pointer ${getOptionStyle(
              key as "a" | "b" | "c" | "d"
            )}`}
          >
            <span className="text-sm">
              <strong>{key.toUpperCase()}</strong>) {value}
            </span>
            {getOptionIcon(key as "a" | "b" | "c" | "d")}
          </div>
        ))}
      </div>

      {showResult && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">
            {selectedOption === question.correctAnswer
              ? "Correct!"
              : "Incorrect"}
          </p>
          <p className="text-sm text-blue-700">
            <strong>Explanation:</strong> {question.solution}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
