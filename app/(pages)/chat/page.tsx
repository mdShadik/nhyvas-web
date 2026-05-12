"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { authApi } from "@/services/apiService";
import { chatService } from "@/services/apiService/chat";
import { manageService } from "@/services/apiService/manage";
import { pageBgClass } from "@/constant";
import { cn } from "@/lib/utils";

export default function ChatListPage() {
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
    const rows = rooms ?? [];
    if (activeListingId === "all") return rows;
    return rows.filter((r) => r.listing_id === activeListingId);
  }, [rooms, activeListingId]);

  return (
    <RequireAuth>
      <main className={`min-h-dvh ${pageBgClass}`}>
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3 border-b border-border bg-bg-card px-4 py-4">
            <MessageCircle className="h-6 w-6 text-text-primary" />
            <h1 className="text-2xl font-extrabold text-text-primary">{t("chat.messages")}</h1>
          </div>

          {!myAdsLoading && listingTabs.length > 1 ? (
            <div className="border-b border-border bg-bg-card px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listingTabs.map((tab) => {
                  const selected = activeListingId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveListingId(tab.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                        selected
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-border bg-bg-input text-text-secondary hover:border-primary-200"
                      )}
                      style={{ maxWidth: 220 }}
                    >
                      <span className="block max-w-[200px] truncate">{tab.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {roomsLoading ? (
            <div className="px-4 py-16 text-center text-text-secondary">{t("common.loading", "Loading…")}</div>
          ) : filteredRooms.length ? (
            <ul className="divide-y divide-border bg-bg-card">
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

                const isUnreadIncoming =
                  item.last_message_is_read === false &&
                  item.last_message_sender_id != null &&
                  item.last_message_sender_id !== currentUserId;

                return (
                  <li key={item.room_id}>
                    <Link
                      href={`/chat/${item.room_id}`}
                      className="flex flex-row items-center px-4 py-4 transition hover:bg-secondary-50 dark:hover:bg-secondary-900/30"
                    >
                      <div className="relative mr-4 h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
                        {avatar ? (
                          <Image src={avatar} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <User className="h-6 w-6 text-text-tertiary" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="truncate text-base font-bold text-text-primary">{name}</span>
                          {timeText ? (
                            <span className="shrink-0 text-xs text-text-tertiary">{timeText}</span>
                          ) : null}
                        </div>
                        <p className={`truncate text-sm ${isUnreadIncoming ? "font-semibold text-text-primary" : "text-text-tertiary"}`}>
                          {lastMsg}
                        </p>
                        {item.property_title ? (
                          <p className="mt-1 truncate text-[11px] text-text-tertiary">
                            {t("chat.re_property", { title: item.property_title })}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <MessageCircle className="mb-4 h-12 w-12 text-text-tertiary" />
              <p className="mb-2 text-lg font-semibold text-text-primary">
                {activeListingId === "all"
                  ? t("chat.empty_title")
                  : t("chat.empty_title_for_listing")}
              </p>
              <p className="max-w-md text-sm text-text-tertiary">
                {activeListingId === "all" ? t("chat.empty_hint") : t("chat.empty_hint_for_listing")}
              </p>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
