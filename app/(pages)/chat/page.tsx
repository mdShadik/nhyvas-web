"use client";

import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { ChatList } from "@/components/chat/ChatList";
import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/apiService/chat";
import { ChatRoomSkeleton } from "@/components/chat/ChatRoomSkeleton";

export default function ChatListPage() {
  const { t } = useTranslation();

  const { isLoading: roomsLoading } = useQuery({
    queryKey: ["chat_rooms"],
    queryFn: () => chatService.getChatRooms(),
  });

  if (roomsLoading) {
    return (
      <>
        <div className="md:hidden h-full">
          <ChatList />
        </div>
        <div className="hidden md:block h-full">
          <ChatRoomSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile view: Full screen list */}
      <div className="md:hidden h-full">
        <ChatList />
      </div>

      {/* Desktop view: Empty placeholder when no room is selected */}
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-secondary-50/30 dark:bg-secondary-900/10">
        <div className="max-w-md text-center px-6">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary-200/50 dark:border-primary-800/50">
            <MessageCircle className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-3">
            {t("chat.empty_title", "Your Messages")}
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {t("chat.empty_hint", "Select a conversation from the left to start chatting and discussing property details.")}
          </p>
        </div>

        <div className="mt-12 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] opacity-50">
          Nhyvas Secure Messaging
        </div>
      </div>
    </>
  );
}
