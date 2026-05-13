import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { roomId?: string; page?: number; pageSize?: number };
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  if (!roomId) return jsonError("roomId is required", 400);
  const page = typeof body?.page === "number" ? Math.max(0, Math.floor(body.page)) : 0;
  const pageSize = typeof body?.pageSize === "number" ? Math.max(1, Math.min(Math.floor(body.pageSize), 50)) : 10;

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("get_chat_messages_page", {
    p_room_id: roomId,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [], pageSize });
}

