"use client";

import { useNotifications } from "@/hooks/useNotifications";

/**
 * Global component to initialize notification listeners.
 * Should be mounted once at the root level within AuthProvider.
 */
export function NotificationManager() {
  useNotifications();
  return null;
}
