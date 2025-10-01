"use client";

import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SharedSidebar } from "@/components/layout/shared-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SharedSidebar showChatSessions={true} />
        <SidebarInset className="flex-1">
          <div className="absolute top-4 left-4 z-50">
            <SidebarTrigger className="bg-blue-50/90 hover:bg-blue-100/90 backdrop-blur-sm shadow-md border border-blue-200/50 text-blue-700 hover:text-blue-900" />
          </div>
          <main className="h-full overflow-hidden">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
