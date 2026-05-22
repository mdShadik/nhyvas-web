"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, CheckCheck, Loader2, MessageCircle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationsStore } from "@/stores/notificationsStore";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  parseData,
  getImageUrl,
  type NotificationItem,
} from "@/services/notifications";

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  // 1. Data Fetching
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications(50),
  });

  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
      return count;
    },
  });

  // 2. Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items = notificationsQuery.data ?? [];
  const loading = notificationsQuery.isLoading;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleOpen = async (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    
    const data = parseData(item.data);
    const roomId = typeof data.roomId === "string" ? data.roomId : null;
    const listingId = typeof data.listingId === "string" ? data.listingId : null;

    onClose();

    if (roomId) {
      router.push(`/chat/${roomId}`);
      return;
    }

    if (listingId) {
      router.push(`/property?id=${listingId}`);
      return;
    }

    if (item.route) {
      router.push(item.route);
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-bold text-text-primary">
            {t("headers.notifications", "Notifications")}
          </span>
        </div>
        {items.some((i) => !i.is_read) ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-400 disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            {t("notifications.mark_all_read", "Mark all read")}
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-text-tertiary" />
            <div className="mt-3 text-sm font-bold text-text-primary">
              {t("notifications.empty_title", "No notifications")}
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              {t("notifications.empty_hint", "You're all caught up!")}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onOpen={() => handleOpen(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const data = parseData(item.data);
  const imageUrl = getImageUrl(data);
  const icon = data.roomId ? (
    <MessageCircle className="h-4 w-4" />
  ) : data.listingId ? (
    <Home className="h-4 w-4" />
  ) : (
    <Bell className="h-4 w-4" />
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-bg-input"
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          item.is_read ? "bg-bg-input text-text-tertiary" : "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className={`truncate text-sm ${
                item.is_read ? "font-medium text-text-secondary" : "font-bold text-text-primary"
              }`}
            >
              {item.title}
            </div>
            <div className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">{item.body}</div>
            {imageUrl ? (
              <div className="relative mt-2 h-28 w-full overflow-hidden rounded-xl bg-bg-input">
                <Image src={imageUrl} alt="" fill className="object-cover" sizes="360px" />
              </div>
            ) : null}
          </div>
          {!item.is_read ? (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
          ) : null}
        </div>
        <div className="mt-1 text-[11px] text-text-tertiary">
          {new Date(item.created_at).toLocaleString()}
        </div>
      </div>
    </button>
  );
}
