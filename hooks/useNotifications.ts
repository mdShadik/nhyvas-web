"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { getUnreadCount, type NotificationItem } from "@/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

/**
 * Hook to manage realtime notifications for the authenticated user.
 * Syncs the unread count in the global store and shows in-app toasts.
 */
export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // 1. Initial count fetch
    void getUnreadCount()
      .then(setUnreadCount)
      .catch((err) => console.error("[useNotifications] Failed to fetch count:", err));

    // 2. Realtime subscription to the notification_events table
    // We filter by recipient_id to only receive relevant updates.
    const channel = supabaseBrowser
      .channel(`user_notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_events",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as NotificationItem;
            
            // Increment unread count locally
            const currentCount = useNotificationsStore.getState().unreadCount;
            setUnreadCount(currentCount + 1);
            
            // Show an in-app toast for the new notification
            showToast({
              title: newNotif.title || "New Notification",
              message: newNotif.body,
              variant: "default",
            });

            // Invalidate notification list queries if any exist
            void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
          } else if (payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            // If a notification was marked as read or deleted, refresh the full count from server
            void getUnreadCount()
              .then(setUnreadCount)
              .catch(() => {});
            
            void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      supabaseBrowser.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, setUnreadCount, showToast, queryClient]);
}
