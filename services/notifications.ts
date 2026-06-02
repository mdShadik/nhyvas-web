import { requestJson } from "@/services/apiService/http";

export type NotificationItem = {
  id: string;
  title: string | null;
  body: string | null;
  category_id: string | null;
  route: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

function parseData(data: NotificationItem["data"]): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "object") return data;
  return {};
}

export function getImageUrl(data: Record<string, unknown>): string | null {
  const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  if (!imageUrl) return null;
  if (!/^https?:\/\//i.test(imageUrl)) return null;
  return imageUrl;
}

export async function listNotifications(limit = 50): Promise<NotificationItem[]> {
  const { rows } = await requestJson<{ rows: NotificationItem[] }>(
    "/api/profile/notifications/list",
    { method: "POST", body: JSON.stringify({ limit }) }
  );
  return rows ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const rows = await listNotifications(100);
  return rows.filter((n) => !n.is_read).length;
}

export async function markAsRead(id: string): Promise<void> {
  await requestJson("/api/profile/notifications/mark-read", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function markAllAsRead(): Promise<void> {
  await requestJson("/api/profile/notifications/mark-all-read", { method: "POST" });
}

export { parseData };
