import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    roomId?: string;
    content?: string;
    type?: "text" | "system" | "image";
  };
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";
  const type = body?.type ?? "text";
  if (!roomId) return jsonError("roomId is required", 400);
  if (!content.trim()) return jsonError("content is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const senderId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!senderId) return jsonError("You need to be logged in.", 401);

  const { data: roomSummary, error: roomError } = await supabase
    .from("chat_room_summaries")
    .select("room_id, tenant_id, landlord_id")
    .eq("room_id", roomId)
    .maybeSingle();
  if (roomError) return jsonError(roomError.message, 400);
  if (!roomSummary) return jsonError("Room not found.", 404);

  const tenantId = (roomSummary as any).tenant_id as string | null;
  const landlordId = (roomSummary as any).landlord_id as string | null;
  const isParticipant = senderId === tenantId || senderId === landlordId;
  if (!isParticipant) return jsonError("Not allowed.", 403);

  const counterpartyId = senderId === tenantId ? landlordId : tenantId;
  void counterpartyId;

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: type === "system" ? null : senderId,
      content,
      message_type: type,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk({ row: data });
}
