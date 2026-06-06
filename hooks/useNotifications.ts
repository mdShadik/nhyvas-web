"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { getUnreadCount, listNotifications, type NotificationItem } from "@/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getWebToken } from "@/services/apiService/http";
import { env } from "@/lib/env";

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const refresh = async (showToastAlert = false) => {
      try {
        const count = await getUnreadCount();
        if (showToastAlert && count > lastCountRef.current) {
          const rows = await listNotifications(5);
          const newest = rows.find((n) => !n.is_read) as NotificationItem | undefined;
          if (newest) {
            showToast({
              title: newest.title || "New Notification",
              message: newest.body ?? "",
              variant: "default",
            });
          }
        }
        lastCountRef.current = count;
        setUnreadCount(count);
        void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      } catch (err) {
        console.error("[useNotifications] Failed to refresh:", err);
      }
    };

    // Initial fetch on mount
    void refresh(false);

    // Setup SSE connection
    const token = getWebToken();
    if (!token) return;

    const sseUrl = `${env.nhyvasApiUrl}/api/v1/profile/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("new_notification", () => {
      // Fetch latest notifications when an event is received
      void refresh(true);
    });

    eventSource.onerror = (err) => {
      console.error("[useNotifications] SSE stream error:", err);
      // EventSource auto-reconnects by default, but we log the error
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated, user?.id, setUnreadCount, showToast, queryClient]);
}
