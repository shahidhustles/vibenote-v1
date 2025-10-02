"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  MessageSquare,
  Plus,
  History,
  FileText,
  Upload,
  BarChart3,
  MoreHorizontal,
  Trash2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Navigation items for the sidebar
const navItems = [
  {
    title: "Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
  },
  {
    title: "Upload Data",
    icon: Upload,
    href: "/upload",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
  },
];

function ChatSessionMenu({ chatId }: { chatId: string }) {
  const deleteSessionMutation = useMutation(api.chat.deleteChat);
  const { user } = useUser();
  const router = useRouter();

  const handleDelete = async () => {
    if (!user) return;

    try {
      await deleteSessionMutation({
        chatId: chatId,
        userId: user.id,
      });
      router.push("/chat");
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-purple-100 text-purple-600 hover:text-purple-800"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-purple-200 bg-white">
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SharedSidebarProps {
  showChatSessions?: boolean;
}

export function SharedSidebar({
  showChatSessions = false,
}: SharedSidebarProps) {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Load user sessions
  const sessions = useQuery(
    api.chat.getUserSessions,
    user ? { userId: user.id } : "skip"
  );

  const handleNewChat = () => {
    router.push(`/chat`);
  };

  const currentChatId = params?.chatId as string;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-purple-200/50 bg-gradient-to-b from-purple-50/40 via-blue-50/30 to-cyan-50/20"
    >
      <SidebarHeader className="border-b border-purple-200/40">
        <div className="flex items-center gap-2 px-1 py-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden text-blue-900">
            VibeNote
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button - only show if chat sessions are enabled */}
        {showChatSessions && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <Button
                  onClick={handleNewChat}
                  className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-500 text-white shadow-md border-0"
                  variant="default"
                >
                  <Plus className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    New Chat
                  </span>
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="bg-purple-200/50" />
          </>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-700 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/chat" &&
                    pathname.startsWith("/chat") &&
                    !currentChatId);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="hover:bg-purple-100/50 data-[active=true]:bg-purple-200/60 data-[active=true]:text-purple-900"
                    >
                      <Link href={item.href} className="text-blue-800">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats - only show if chat sessions are enabled */}
        {showChatSessions && (
          <>
            <Separator className="bg-purple-200/50" />

            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-purple-700 font-medium">
                <History className="h-4 w-4" />
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sessions?.map((session) => {
                    const isActive = Boolean(
                      currentChatId &&
                        session.chatId &&
                        currentChatId === session.chatId
                    );

                    return (
                      <SidebarMenuItem key={session._id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="hover:bg-purple-100/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-200/80 data-[active=true]:via-blue-200/60 data-[active=true]:to-cyan-200/40 data-[active=true]:border-l-2 data-[active=true]:border-purple-500"
                        >
                          <Link
                            href={`/chat/${session.chatId}`}
                            className="flex items-center gap-2 pr-8 relative p-2 group-data-[collapsible=icon]:hidden w-full"
                          >
                            <span className="font-medium text-sm truncate w-full text-blue-900 data-[active=true]:text-blue-950">
                              {session.title}
                            </span>
                            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChatSessionMenu chatId={session.chatId} />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }) || []}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-purple-200/40 bg-purple-50/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SignedIn>
              <div className="flex items-center gap-2 px-2 py-1">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate text-blue-900">
                    {user?.firstName}
                  </span>
                  <span className="text-xs text-blue-600">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-500 text-white"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
