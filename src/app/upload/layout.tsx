"use client";

import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SharedSidebar } from "@/components/layout/shared-sidebar";

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SharedSidebar showChatSessions={false} />
        <SidebarInset className="flex-1">
          <div className="absolute top-4 left-4 z-50">
            <SidebarTrigger className="bg-white/90 hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900 backdrop-blur-sm shadow-md border" />
          </div>
          <main className="h-full overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
