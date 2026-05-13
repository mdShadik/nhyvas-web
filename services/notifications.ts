import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { Database } from "@/types/supabase";

type NotificationEvent = Database["public"]["Tables"]["notification_events"]["Row"];

export type NotificationItem = Pick<
  NotificationEvent,
  "id" | "title" | "body" | "category_id" | "route" | "data" | "is_read" | "created_at" | "read_at"
>;

function parseData(data: NotificationEvent["data"]): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "object") return data as Record<string, unknown>;
  try {
    return JSON.parse(data as string) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getImageUrl(data: Record<string, unknown>): string | null {
  const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  if (!imageUrl) return null;
  if (!/^https?:\/\//i.test(imageUrl)) return null;
  return imageUrl;
}

export async function listNotifications(limit = 50): Promise<NotificationItem[]> {
  const { data, error } = await supabaseBrowser
    .from("notification_events")
    .select("id, title, body, category_id, route, data, is_read, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NotificationItem[];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabaseBrowser
    .from("notification_events")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  await supabaseBrowser
    .from("notification_events")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markAllAsRead(): Promise<void> {
  await supabaseBrowser.rpc("mark_all_notifications_read");
}

export { parseData };
