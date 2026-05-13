import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { roomId?: string };
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  if (!roomId) return jsonError("roomId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.from("chat_messages").select("*").eq("room_id", roomId).order("created_at", {
    ascending: true,
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

