"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronLeft, MoreVertical, Send, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { noImagePlaceholder } from "@/assets";
import { authApi } from "@/services/apiService";
import { chatService, type ChatMessage, type ChatMessagesPage } from "@/services/apiService/chat";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChatRoomSkeleton } from "./ChatRoomSkeleton";

const CHAT_PAGE_SIZE = 10;
const TOP_FETCH_THRESHOLD = 40;

function dedupeByMessageId(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const deduped: ChatMessage[] = [];
  for (const message of messages) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    deduped.push(message);
  }
  return deduped;
}

function reconcileIncomingMessage(oldMessages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const existingIndex = oldMessages.findIndex((message) => message.id === incoming.id);
  if (existingIndex >= 0) {
    const copy = [...oldMessages];
    copy[existingIndex] = incoming;
    return dedupeByMessageId(copy);
  }

  const matchedTempIndex = oldMessages.findIndex((message) => {
    if (!message.id.startsWith("temp-")) return false;
    if (message.sender_id !== incoming.sender_id) return false;
    if (message.content !== incoming.content) return false;
    return Math.abs(new Date(message.created_at).getTime() - new Date(incoming.created_at).getTime()) < 60_000;
  });

  if (matchedTempIndex >= 0) {
    const copy = [...oldMessages];
    copy[matchedTempIndex] = incoming;
    return dedupeByMessageId(copy);
  }

  return dedupeByMessageId([...oldMessages, incoming]);
}

function flattenPages(data?: InfiniteData<ChatMessagesPage>): ChatMessage[] {
  if (!data?.pages?.length) return [];
  return dedupeByMessageId([...data.pages].reverse().flatMap((page) => page.messages));
}

function mapAllMessages(
  data: InfiniteData<ChatMessagesPage> | undefined,
  transform: (messages: ChatMessage[]) => ChatMessage[]
): InfiniteData<ChatMessagesPage> | undefined {
  if (!data?.pages?.length) {
    const nextAll = transform([]);
    return {
      pageParams: [0],
      pages: [{ messages: nextAll, hasMore: false }],
    };
  }

  const all = flattenPages(data);
  const nextAll = transform(all);
  const newestFirstPages = [...data.pages].reverse();
  const olderCount = newestFirstPages.slice(1).reduce((acc, page) => acc + page.messages.length, 0);
  const newestPageMessages = nextAll.slice(olderCount);

  newestFirstPages[0] = {
    ...newestFirstPages[0],
    messages: newestPageMessages,
  };

  return {
    ...data,
    pages: [...newestFirstPages].reverse(),
  };
}

const MessageBubble = memo(function MessageBubble({
  item,
  isMe,
  counterpartyAvatarUrl,
}: {
  item: ChatMessage;
  isMe: boolean;
  counterpartyAvatarUrl: string | null | undefined;
}) {
  const { t } = useTranslation();

  if (item.message_type === "system") {
    return (
      <div className="my-6 flex justify-center px-4">
        <div className="rounded-full bg-secondary-100 px-4 py-1.5 dark:bg-secondary-800/50 border border-border/50">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary">{item.content}</p>
        </div>
      </div>
    );
  }

  const isImage = item.message_type === "image";
  const imgSrc =
    isImage &&
    typeof item.content === "string" &&
    (item.content.startsWith("http://") || item.content.startsWith("https://"))
      ? item.content
      : null;

  const timeText = item.created_at 
    ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  return (
    <div className={cn("my-1.5 flex px-4 group", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="relative mr-2.5 mt-auto mb-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary-100 dark:bg-secondary-800 shadow-sm transition-transform group-hover:scale-110">
          {counterpartyAvatarUrl ? (
            <Image src={counterpartyAvatarUrl} alt="" fill unoptimized className="object-cover" sizes="32px" />
          ) : (
            <User className="h-4 w-4 text-text-tertiary" aria-hidden />
          )}
        </div>
      )}

      <div className={cn(
        "relative flex flex-col max-w-[85%] sm:max-w-[70%]",
        isMe ? "items-end" : "items-start"
      )}>
        <div
          className={cn(
            "rounded-[20px] px-4 py-2.5 shadow-sm transition-all duration-200",
            isMe
              ? "rounded-br-none bg-primary-500 text-white shadow-primary-500/10"
              : "rounded-bl-none border border-border bg-bg-card text-text-primary shadow-black/5"
          )}
        >
          {imgSrc ? (
            <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
              <Image 
                src={imgSrc} 
                alt={t("chat.room.image_attachment_alt", "Attached image")} 
                width={320}
                height={240}
                unoptimized
                className="max-h-64 object-cover hover:scale-105 transition-transform duration-300" 
              />
            </a>
          ) : (
            <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>
          )}
        </div>
        
        {timeText && (
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-tight mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isMe ? "text-primary-600 dark:text-primary-400" : "text-text-tertiary"
          )}>
            {timeText}
          </span>
        )}
      </div>
    </div>
  );
});

export type ListingChatRoomProps = {
  roomId: string;
  /**
   * When true, skips top navigation chrome (caller provides layout/back).
   */
  embedded?: boolean;
};

export function ListingChatRoom({ roomId, embedded }: ListingChatRoomProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<null | "block" | "report">(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollOffsetYRef = useRef(0);
  const contentHeightRef = useRef(0);
  const pendingPrependAdjustRef = useRef<{ prevHeight: number; prevOffset: number } | null>(null);
  const initialScrollDoneRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUserId,
  });

  const { data: roomDetails } = useQuery({
    queryKey: ["chat_room", roomId],
    queryFn: () => chatService.getRoomDetails(roomId, currentUserId ?? ""),
    enabled: Boolean(roomId && currentUserId),
  });

  const counterpartyId = roomDetails?.counterparty?.id ?? null;

  const { data: blockInfo } = useQuery({
    queryKey: ["chat_block_status", currentUserId, counterpartyId],
    enabled: Boolean(currentUserId && counterpartyId),
    queryFn: async () => {
      const me = currentUserId as string;
      const other = counterpartyId as string;
      const { data, error } = await supabaseBrowser
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(`and(blocker_id.eq.${me},blocked_id.eq.${other}),and(blocker_id.eq.${other},blocked_id.eq.${me})`)
        .limit(2);

      if (error) throw error;
      const rows = (data ?? []) as Array<{ blocker_id: string; blocked_id: string }>;
      if (!rows.length) return { blocked: false, byMe: false };
      return { blocked: true, byMe: rows.some((r) => r.blocker_id === me) };
    },
  });

  const {
    data: pagedMessages,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat_messages", roomId],
    queryFn: ({ pageParam = 0 }) => chatService.getChatMessagesPage(roomId, pageParam, CHAT_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
    enabled: Boolean(roomId),
  });

  const messages = flattenPages(pagedMessages);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const channelName = `public:chat_messages:${roomId}:${Date.now()}`;
    const channel = supabaseBrowser
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          queryClient.setQueryData(
            ["chat_messages", roomId],
            (old: InfiniteData<ChatMessagesPage> | undefined) =>
              mapAllMessages(old, (all) => reconcileIncomingMessage(all, newMessage))
          );
          scrollToBottom("smooth");
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomId, queryClient, scrollToBottom]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatService.sendMessage(roomId, currentUserId ?? "", text, "text"),
    onMutate: async (text) => {
      setMessageText("");
      await queryClient.cancelQueries({ queryKey: ["chat_messages", roomId] });
      const previousMessages = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(["chat_messages", roomId]);

      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        room_id: roomId,
        sender_id: currentUserId ?? null,
        content: text,
        message_type: "text",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["chat_messages", roomId],
        (old: InfiniteData<ChatMessagesPage> | undefined) => mapAllMessages(old, (all) => [...all, tempMessage])
      );
      scrollToBottom();

      return { previousMessages, tempId };
    },
    onSuccess: (savedMessage, _text, context) => {
      if (!context?.tempId) return;
      queryClient.setQueryData(
        ["chat_messages", roomId],
        (old: InfiniteData<ChatMessagesPage> | undefined) =>
          mapAllMessages(old, (all) => {
            const replaced = all.map((message) => (message.id === context.tempId ? savedMessage : message));
            return dedupeByMessageId(replaced);
          })
      );
      scrollToBottom("smooth");
    },
    onError: (_err, _text, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["chat_messages", roomId], context.previousMessages);
      }
    },
    onSettled: () => {
      scrollToBottom();
    },
  });

  const loadOlderMessages = useCallback(() => {
    const el = scrollRef.current;
    if (!hasNextPage || isFetchingNextPage || messagesLoading || !el) return;
    pendingPrependAdjustRef.current = {
      prevHeight: el.scrollHeight,
      prevOffset: scrollOffsetYRef.current,
    };
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, messagesLoading]);

  useEffect(() => {
    if (!messages.length || initialScrollDoneRef.current) return;
    const timer = window.setTimeout(() => {
      scrollToBottom("auto");
      initialScrollDoneRef.current = true;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isFetchingNextPage) return;
    const pending = pendingPrependAdjustRef.current;
    if (!pending) return;
    const el = scrollRef.current;
    if (!el) {
      pendingPrependAdjustRef.current = null;
      return;
    }
    requestAnimationFrame(() => {
      const nextScrollTop = pending.prevOffset + Math.max(0, el.scrollHeight - pending.prevHeight);
      el.scrollTop = nextScrollTop;
      pendingPrependAdjustRef.current = null;
    });
  }, [isFetchingNextPage, messages.length]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!menuOpen) return;
      const root = menuRef.current;
      if (!root?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  const handleSend = () => {
    const txt = messageText.trim();
    if (!txt || !currentUserId) return;
    sendMutation.mutate(txt);
  };

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!roomDetails?.counterparty?.id || !currentUserId) return;
      if (blockInfo?.blocked && blockInfo.byMe) {
        await chatService.unblockUser(currentUserId, roomDetails.counterparty.id);
      } else {
        await chatService.blockUser(currentUserId, roomDetails.counterparty.id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat_block_status"] });
      void queryClient.invalidateQueries({ queryKey: ["chat_room", roomId] });
      void queryClient.invalidateQueries({ queryKey: ["chat_rooms"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!roomDetails?.counterparty?.id || !currentUserId) return;
      await chatService.reportUser(currentUserId, roomDetails.counterparty.id, t("chat.menu.report_default_reason"));
    },
    onSuccess: () => router.push("/chat"),
  });

  const propertyHref = roomDetails?.listing_id ? `/property?id=${encodeURIComponent(roomDetails.listing_id)}` : null;
  const thumb: string | StaticImageData = roomDetails?.property_thumbnail ?? noImagePlaceholder;

  const dialogCopy = useMemo(() => {
    const name = roomDetails?.counterparty?.full_name ?? t("chat.unknown_user");
    if (confirmModal === "block") {
      if (blockInfo?.blocked && blockInfo.byMe) {
        return {
          title: t("chat.menu.confirm_unblock_title"),
          body: t("chat.menu.confirm_unblock_body", { name }),
          confirm: t("chat.menu.confirm_unblock_action"),
        };
      }
      return {
        title: t("chat.menu.confirm_block_title"),
        body: t("chat.menu.confirm_block_body", { name }),
        confirm: t("chat.menu.confirm_block_action"),
      };
    }
    if (confirmModal === "report") {
      return {
        title: t("chat.menu.confirm_report_title"),
        body: t("chat.menu.confirm_report_body", { name }),
        confirm: t("chat.menu.confirm_report_action"),
      };
    }
    return null;
  }, [confirmModal, roomDetails?.counterparty?.full_name, blockInfo?.blocked, blockInfo?.byMe, t]);

  const isInitialLoading = (messagesLoading || (!roomDetails && !!roomId));

  if (isInitialLoading) {
    return <ChatRoomSkeleton />;
  }

  const embeddedHeader: ReactNode = embedded ? (
    <div className="sticky top-0 z-30 border-b border-border bg-bg-card/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="md:hidden shrink-0 rounded-full p-1 text-text-primary hover:bg-secondary-100 dark:hover:bg-secondary-800"
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-6 w-6 text-text-primary" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
            {roomDetails?.counterparty?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={roomDetails.counterparty.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-text-tertiary" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-text-primary">
              {roomDetails?.counterparty?.full_name ?? t("chat.room.loading_contact", "Loading…")}
            </p>
            {roomDetails?.property_title ? (
              <p className="truncate text-[11px] font-bold text-text-tertiary">
                {roomDetails.property_title}
              </p>
            ) : null}
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            className="rounded-full p-2 text-text-primary hover:bg-secondary-100 dark:hover:bg-secondary-800"
            aria-label={t("chat.room.chat_actions")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical className="h-6 w-6" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-40 mt-1 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-2xl border border-border bg-bg-card py-2 shadow-lg">
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmModal("block");
                }}
              >
                <div className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  blockInfo?.byMe ? "bg-green-500/15" : "bg-red-500/15"
                )}>
                  <span className="sr-only">{blockInfo?.byMe ? t("chat.menu.unblock") : t("chat.menu.block")}</span>
                  <span className={cn(
                    "font-bold",
                    blockInfo?.byMe ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {blockInfo?.byMe ? "✓" : "⨉"}
                  </span>
                </div>
                <span>
                  <span className={cn(
                    "block font-semibold",
                    blockInfo?.byMe ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {blockInfo?.byMe
                      ? t("chat.menu.unblock_title", { name: roomDetails?.counterparty?.full_name ?? t("chat.unknown_user") })
                      : t("chat.menu.block_title", { name: roomDetails?.counterparty?.full_name ?? t("chat.unknown_user") })
                    }
                  </span>
                  <span className="mt-0.5 block text-xs text-text-tertiary">
                    {blockInfo?.byMe ? t("chat.menu.unblock_hint") : t("chat.menu.block_hint")}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmModal("report");
                }}
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <span className="text-lg">⚠</span>
                </div>
                <span>
                  <span className="block font-semibold text-amber-700 dark:text-amber-400">
                    {t("chat.menu.report_title")}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-tertiary">{t("chat.menu.report_hint")}</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {roomDetails?.property_title && propertyHref ? (
        <Link
          href={propertyHref}
          className="flex items-center gap-3 px-4 pb-3 -mt-1 transition hover:opacity-90"
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary-100 dark:bg-secondary-800">
            <Image src={thumb} alt="" fill unoptimized sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              {t("chat.room.discussing_property")}
            </p>
            <p className="truncate text-sm font-bold text-text-primary">{roomDetails.property_title}</p>
          </div>
        </Link>
      ) : null}
    </div>
  ) : null;

  const headerChrome: ReactNode = embedded ? null : (
    <div className="flex items-center justify-between border-b border-border bg-bg-card px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="shrink-0 rounded-full p-1 text-text-primary hover:bg-secondary-100 dark:hover:bg-secondary-800 md:hidden"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-6 w-6 text-text-primary" />
        </button>


        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
          {roomDetails?.counterparty?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={roomDetails.counterparty.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-text-tertiary" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-bold text-text-primary">
            {roomDetails?.counterparty?.full_name ?? t("chat.room.loading_contact", "Loading…")}
          </p>
        </div>
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          className="rounded-full p-2 text-text-primary hover:bg-secondary-100 dark:hover:bg-secondary-800"
          aria-label={t("chat.room.chat_actions")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreVertical className="h-6 w-6" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 z-40 mt-1 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-2xl border border-border bg-bg-card py-2 shadow-lg">
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900"
              onClick={() => {
                setMenuOpen(false);
                setConfirmModal("block");
              }}
            >
              <div className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                blockInfo?.byMe ? "bg-green-500/15" : "bg-red-500/15"
              )}>
                <span className="sr-only">{blockInfo?.byMe ? t("chat.menu.unblock") : t("chat.menu.block")}</span>
                <span className={cn(
                  "font-bold",
                  blockInfo?.byMe ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {blockInfo?.byMe ? "✓" : "⨉"}
                </span>
              </div>
              <span>
                <span className={cn(
                  "block font-semibold",
                  blockInfo?.byMe ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {blockInfo?.byMe
                    ? t("chat.menu.unblock_title", { name: roomDetails?.counterparty?.full_name ?? t("chat.unknown_user") })
                    : t("chat.menu.block_title", { name: roomDetails?.counterparty?.full_name ?? t("chat.unknown_user") })}
                </span>
                <span className="mt-0.5 block text-xs text-text-tertiary">
                  {blockInfo?.byMe ? t("chat.menu.unblock_hint") : t("chat.menu.block_hint")}
                </span>
              </span>
            </button>

            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900"
              onClick={() => {
                setMenuOpen(false);
                setConfirmModal("report");
              }}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <span className="text-lg">⚠</span>
              </div>
              <span>
                <span className="block font-semibold text-amber-700 dark:text-amber-400">
                  {t("chat.menu.report_title")}
                </span>
                <span className="mt-0.5 block text-xs text-text-tertiary">{t("chat.menu.report_hint")}</span>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={cn(!embedded ? `flex min-h-dvh flex-col` : "flex h-full min-h-80 flex-col bg-bg-page relative")}>
      {embeddedHeader}
      {headerChrome}

      {roomDetails?.property_title && propertyHref ? (
        <Link
          href={propertyHref}
          className={cn(
            "flex items-center gap-3 border-b border-border bg-secondary-50 px-4 py-2 transition hover:bg-secondary-100 dark:bg-secondary-900/30 dark:hover:bg-secondary-900/50",
            embedded ? "hidden" : ""
          )}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
            <Image src={thumb} alt="" fill unoptimized sizes="44px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
              {t("chat.room.discussing_property")}
            </p>
            <p className="truncate text-sm font-bold text-text-primary">{roomDetails.property_title}</p>
          </div>
        </Link>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          scrollOffsetYRef.current = el.scrollTop;
          contentHeightRef.current = el.scrollHeight;
          if (el.scrollTop <= TOP_FETCH_THRESHOLD) loadOlderMessages();
        }}
      >
        <div className="py-3">
          {isFetchingNextPage ? (
            <div className="flex justify-center py-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : null}
          {messagesLoading ? (
            <div className="space-y-2 px-4 py-20 text-center text-text-tertiary">{t("common.loading", "Loading…")}</div>
          ) : (
            messages.map((item) => (
              <MessageBubble
                key={item.id}
                item={item}
                isMe={item.sender_id === currentUserId}
                counterpartyAvatarUrl={roomDetails?.counterparty?.avatar_url}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border bg-bg-card px-4 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] pt-3">
        {blockInfo?.blocked ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              {blockInfo.byMe
                ? t("chat.room.blocked_by_you", "You blocked this user. Unblock to send messages.")
                : t("chat.room.cannot_message_longer", "You cannot message anymore.")}
            </div>
            {blockInfo.byMe ? (
              <button
                type="button"
                disabled={blockMutation.isPending}
                onClick={() => setConfirmModal("block")}
                className="text-sm font-extrabold text-primary-600 hover:text-primary-500 disabled:opacity-60"
              >
                {t("chat.menu.unblock", "Unblock")}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onFocus={() =>
                window.setTimeout(() => {
                  scrollToBottom("smooth");
                }, 160)
              }
              placeholder={t("chat.room.type_placeholder")}
              rows={1}
              className="max-h-32 min-h-11 flex-1 resize-y rounded-full border border-border bg-bg-input px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15"
              disabled={!currentUserId}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!messageText.trim() || sendMutation.isPending || !currentUserId}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white",
                messageText.trim() && !sendMutation.isPending ? "bg-primary-600" : "bg-border text-white/70"
              )}
              aria-label={t("chat.room.send")}
            >
              <Send className="h-4.5 w-4.5" style={{ marginLeft: -2 }} />
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={confirmModal !== null}
        title={dialogCopy?.title ?? ""}
        confirmLabel={dialogCopy?.confirm}
        cancelLabel={t("support.cancel")}
        confirmVariant={confirmModal === "block" ? "destructive" : "default"}
        busy={blockMutation.isPending || reportMutation.isPending}
        onClose={() =>
          !(blockMutation.isPending || reportMutation.isPending) && setConfirmModal(null)
        }
        onConfirm={() => {
          void (async () => {
            try {
              if (confirmModal === "block") await blockMutation.mutateAsync();
              if (confirmModal === "report") await reportMutation.mutateAsync();
            } finally {
              setConfirmModal(null);
            }
          })();
        }}
      >
        <p className="text-[15px] text-text-secondary">{dialogCopy?.body}</p>
      </Dialog>
    </div>
  );
}
