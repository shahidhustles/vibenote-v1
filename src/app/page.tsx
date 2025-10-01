"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, BookOpen } from "lucide-react";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // Redirect authenticated users to chat
      router.push("/chat");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <MessageSquare className="h-16 w-16 text-primary" />
              <Brain className="h-8 w-8 text-secondary absolute -top-2 -right-2" />
            </div>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-6">
            VibeNote
          </h1>

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Transform your learning with AI-powered conversations and
            intelligent knowledge management. Ask questions, store insights, and
            build your personal educational assistant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => router.push("/chat")}
              className="text-lg px-8 py-6"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Start Learning
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Smart Conversations</h3>
            <p className="text-muted-foreground">
              Engage in natural conversations with an AI that understands your
              learning style and adapts to help you grow.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Knowledge Management</h3>
            <p className="text-muted-foreground">
              Build your personal knowledge base with intelligent storage and
              retrieval of information that matters to you.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Educational Focus</h3>
            <p className="text-muted-foreground">
              Designed specifically for learning with features that help you
              understand, remember, and apply new concepts.
            </p>
          </div>
        </div>

        {/* Phase 1 Complete Notice */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-primary mb-2">
              🚀 Phase 1 Complete!
            </h4>
            <p className="text-sm text-muted-foreground">
              Core UI components, session management, and Convex integration are
              ready. AI integration comes in Phase 2!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
