"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { getUnreadCount, listNotifications, type NotificationItem } from "@/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let lastCount = 0;

    const refresh = async () => {
      try {
        const count = await getUnreadCount();
        if (count > lastCount && lastCount > 0) {
          const rows = await listNotifications(5);
          const newest = rows.find((n) => !n.is_read) as NotificationItem | undefined;
          if (newest) {
            showToast({
              title: newest.title || "New Notification",
              message: newest.body ?? undefined,
              variant: "default",
            });
          }
        }
        lastCount = count;
        setUnreadCount(count);
        void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      } catch (err) {
        console.error("[useNotifications] Failed to refresh:", err);
      }
    };

    void refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, setUnreadCount, showToast, queryClient]);
}
