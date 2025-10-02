"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QuizCard, { type QuizQuestion } from "./QuizCard";
import { gsap } from "gsap";

interface QuizContainerProps {
  questions: QuizQuestion[];
  onResultsShow?: (showingResults: boolean) => void;
}

type UserAnswer = {
  questionIndex: number;
  selectedOption: "a" | "b" | "c" | "d";
  isCorrect: boolean;
  question: QuizQuestion;
};

const QuizContainer = ({ questions, onResultsShow }: QuizContainerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionAnswered, setCurrentQuestionAnswered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onResultsShow) {
      onResultsShow(showResults);
    }
  }, [showResults, onResultsShow]);

  const handleAnswer = (
    selectedOption: "a" | "b" | "c" | "d",
    isCorrect: boolean
  ) => {
    const answerData: UserAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption,
      isCorrect,
      question: questions[currentQuestionIndex],
    };

    setUserAnswers((prev) => [...prev, answerData]);
    setCurrentQuestionAnswered(true);
  };

  const handleNextQuestion = useCallback(() => {
    if (!currentQuestionAnswered) return;

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: "100%",
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setCurrentQuestionAnswered(false);

            if (cardRef.current) {
              gsap.set(cardRef.current, { x: "-100%", opacity: 0 });
              gsap.to(cardRef.current, {
                x: "0%",
                opacity: 1,
                duration: 0.5,
                ease: "power2.inOut",
                delay: 0.1,
              });
            }
          } else {
            setShowResults(true);
            if (cardRef.current) {
              gsap.set(cardRef.current, { x: "0%", opacity: 1 });
            }
          }
        },
      });
    }
  }, [currentQuestionAnswered, currentQuestionIndex, questions.length]);

  useEffect(() => {
    if (currentQuestionAnswered) {
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentQuestionAnswered, handleNextQuestion]);

  useEffect(() => {
    if (cardRef.current && !currentQuestionAnswered) {
      gsap.set(cardRef.current, { x: "0%", opacity: 1 });
    }
  }, [currentQuestionIndex, currentQuestionAnswered]);

  const score = userAnswers.filter((answer) => answer.isCorrect).length;

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return "Excellent! 🎉";
    if (percentage >= 80) return "Great job! 👏";
    if (percentage >= 70) return "Good work! 👍";
    if (percentage >= 60) return "Not bad! 📚";
    return "Keep studying! 💪";
  };

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg">Interactive Quiz</h3>
            <div className="text-sm text-gray-600">
              Question: {currentQuestionIndex + 1}/{questions.length}
            </div>
          </div>

          <div ref={cardRef} className="relative">
            <QuizCard
              key={currentQuestionIndex}
              question={questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              onAnswer={handleAnswer}
            />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              Quiz Complete!
            </h3>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor()}`}>
              {score}/{questions.length}
            </div>
            <p className="text-lg mb-1 text-gray-700">
              {((score / questions.length) * 100).toFixed(0)}% Correct
            </p>
            <p className="text-lg font-medium mb-4 text-gray-600">
              {getScoreMessage()}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Review Your Answers
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {userAnswers.map((answer, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <h5 className="font-medium mb-2">
                    {index + 1}. {answer.question.question}
                  </h5>

                  <div className="space-y-2 mb-3">
                    {Object.entries(answer.question.options).map(
                      ([key, value]) => {
                        let optionStyle = "p-2 rounded border text-sm ";

                        if (key === answer.question.correctAnswer) {
                          optionStyle +=
                            "border-green-500 bg-green-50 text-green-700";
                        } else if (
                          key === answer.selectedOption &&
                          !answer.isCorrect
                        ) {
                          optionStyle +=
                            "border-red-500 bg-red-50 text-red-700";
                        } else {
                          optionStyle +=
                            "border-gray-200 bg-white text-gray-600";
                        }

                        return (
                          <div key={key} className={optionStyle}>
                            <strong>{key.toUpperCase()}</strong>){" "}
                            {value as string}
                            {key === answer.question.correctAnswer && (
                              <span className="ml-2 text-green-600">
                                ✓ Correct
                              </span>
                            )}
                            {key === answer.selectedOption &&
                              !answer.isCorrect && (
                                <span className="ml-2 text-red-600">
                                  ✗ Your Answer
                                </span>
                              )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Explanation:</strong> {answer.question.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizContainer;
