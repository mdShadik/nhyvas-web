/**
 * Browser-level push notification registration service.
 * Handles permission requests and background push subscription.
 */

import { profileService } from "@/services/apiService/profile";

/**
 * Base64 helper for VAPID key conversion.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushRegistrationService = {
  /**
   * Checks if push notifications are supported in the current environment.
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  },

  /**
   * Requests permission and subscribes the user to push notifications.
   * @param vapidPublicKey The public VAPID key from the push provider.
   */
  async register(vapidPublicKey: string): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      // 2. Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Send subscription to our backend
      // We stringify the entire subscription object as the "token" for now.
      // This is a common pattern for standard Web Push.
      await profileService.registerPushDevice({
        expoPushToken: JSON.stringify(subscription),
        platform: "web",
        deviceId: navigator.userAgent,
      });

      return true;
    } catch (err) {
      console.error("[pushRegistration] Registration failed:", err);
      return false;
    }
  },

  /**
   * Checks if the user has already granted notification permissions.
   */
  getPermissionStatus(): NotificationPermission {
    return typeof window !== "undefined" ? Notification.permission : "default";
  },
};
