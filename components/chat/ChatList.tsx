"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, User, Building2, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authApi } from "@/services/apiService";
import { chatService } from "@/services/apiService/chat";
import { manageService } from "@/services/apiService/manage";
import { cn } from "@/lib/utils";
import { ChatListSkeleton } from "./ChatListSkeleton";

interface ChatListProps {
  activeRoomId?: string;
  className?: string;
}

export function ChatList({ activeRoomId, className }: ChatListProps) {
  const { t } = useTranslation();
  const [activeListingId, setActiveListingId] = useState<string>("all");

  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUserId,
  });

  const { data: myAds = [], isLoading: myAdsLoading } = useQuery({
    queryKey: ["chat_my_ads"],
    queryFn: () => manageService.getMyAds(),
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["chat_rooms"],
    queryFn: () => chatService.getChatRooms(),
    refetchInterval: 10000,
  });

  const listingTabs = useMemo(() => {
    const tabs: { id: string; title: string }[] = [{ id: "all", title: t("chat.tabs_all", "All") }];
    for (const ad of myAds) {
      const title = (ad?.property_title ?? "").toString().trim();
      tabs.push({
        id: ad.id,
        title: title.length ? title : t("chat.untitled_property", "Untitled property"),
      });
    }
    return tabs;
  }, [myAds, t]);

  const filteredRooms = useMemo(() => {
    let rows = rooms ?? [];
    if (activeListingId !== "all") {
      rows = rows.filter((r) => r.listing_id === activeListingId);
    }
    return rows;
  }, [rooms, activeListingId]);

  return (
    <div className={cn("flex flex-col h-full bg-bg-page", className)}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border bg-bg-page/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Link 
            href="/"
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-primary" />
          </Link>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            {t("chat.messages")}
            <div className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
              {rooms?.filter(r => r.last_message_is_read === false && r.last_message_sender_id !== currentUserId).length || 0}
            </div>
          </h1>
        </div>

        {/* Property Tabs */}
        {!myAdsLoading && listingTabs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {listingTabs.map((tab) => {
              const selected = activeListingId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveListingId(tab.id)}
                  className={cn(
                    "shrink-0 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                    selected
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                      : "bg-secondary-100 dark:bg-secondary-800 text-text-secondary hover:bg-secondary-200 dark:hover:bg-secondary-700"
                  )}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {roomsLoading ? (
          <ChatListSkeleton />
        ) : filteredRooms.length ? (
          <div className="divide-y divide-border/50">
            {filteredRooms.map((item) => {
              const counterparty = item.counterparty;
              const name = counterparty?.full_name || t("chat.unknown_user");
              const avatar = counterparty?.avatar_url;
              let lastMsg = item.last_message_content || t("chat.no_messages_yet");
              if (item.last_message_type === "system") {
                lastMsg = t("chat.room.system_prefix", { text: lastMsg });
              }

              let timeText = "";
              if (item.last_message_created_at) {
                const d = new Date(item.last_message_created_at);
                const today = new Date();
                if (d.toDateString() === today.toDateString()) {
                  timeText = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                } else {
                  timeText = d.toLocaleDateString([], { month: "short", day: "numeric" });
                }
              }

              const isActive = activeRoomId === item.room_id;
              const isUnread =
                item.last_message_is_read === false &&
                item.last_message_sender_id != null &&
                item.last_message_sender_id !== currentUserId;

              return (
                <Link
                  key={item.room_id}
                  href={`/chat/${item.room_id}`}
                  className={cn(
                    "flex flex-row items-center gap-4 px-4 py-4 transition-all duration-200 group relative",
                    isActive 
                      ? "bg-primary-50 dark:bg-primary-900/20" 
                      : "hover:bg-secondary-50 dark:hover:bg-secondary-800/30"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full" />
                  )}

                  <div className="relative">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[20px] border border-border bg-secondary-100 dark:bg-secondary-800 transition-transform group-hover:scale-105 shadow-sm">
                      {avatar ? (
                        <Image src={avatar} alt="" fill unoptimized className="object-cover" sizes="56px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <User className="h-7 w-7 text-text-tertiary" />
                        </span>
                      )}
                    </div>
                    {isUnread && (
                       <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 border-2 border-bg-page rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className={cn(
                        "truncate text-[15px] transition-colors",
                        isUnread || isActive ? "font-extrabold text-text-primary" : "font-semibold text-text-secondary group-hover:text-text-primary"
                      )}>{name}</span>
                      {timeText && (
                        <span className={cn(
                          "shrink-0 text-[10px] font-bold uppercase tracking-wider",
                          isUnread ? "text-primary-500" : "text-text-tertiary"
                        )}>{timeText}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 min-w-0">
                       <p className={cn(
                        "truncate text-sm flex-1",
                        isUnread ? "font-bold text-text-primary" : "text-text-tertiary"
                      )}>
                        {lastMsg}
                      </p>
                    </div>

                    {item.property_title && (
                      <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 bg-secondary-100/50 dark:bg-secondary-800/50 rounded-md w-fit max-w-full">
                        <Building2 className="h-3 w-3 text-text-tertiary shrink-0" />
                        <p className="truncate text-[10px] font-bold text-text-tertiary uppercase tracking-tight">
                          {item.property_title}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mb-6 shadow-inner">
               <MessageCircle className="h-10 w-10 text-text-tertiary" />
            </div>
            <p className="mb-2 text-lg font-bold text-text-primary">
              {activeListingId === "all"
                ? t("chat.empty_title")
                : t("chat.empty_title_for_listing")}
            </p>
            <p className="max-w-[240px] mx-auto text-sm text-text-tertiary leading-relaxed">
              {activeListingId === "all" ? t("chat.empty_hint") : t("chat.empty_hint_for_listing")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
