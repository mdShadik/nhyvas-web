import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { roomId?: string };
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  if (!roomId) return jsonError("roomId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const currentUserId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!currentUserId) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.from("chat_room_summaries").select("*").eq("room_id", roomId).single();
  if (error) return jsonError(error.message, 400);

  const counterpartyId = (data as any).tenant_id === currentUserId ? (data as any).landlord_id : (data as any).tenant_id;
  if (counterpartyId) {
    const { data: blockRow, error: blockError } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(
        `and(blocker_id.eq.${currentUserId},blocked_id.eq.${counterpartyId}),and(blocker_id.eq.${counterpartyId},blocked_id.eq.${currentUserId})`
      )
      .limit(1)
      .maybeSingle();
    if (blockError) return jsonError(blockError.message, 400);
    if (blockRow) {
      (data as any).listing_id = null;
      (data as any).property_title = null;
      (data as any).property_thumbnail = null;
    }
  }

  let counterparty = null as null | { id: string; full_name: string | null; avatar_url: string | null };
  if (counterpartyId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", counterpartyId)
      .maybeSingle();
    if (profile) counterparty = profile as any;
  }

  return jsonOk({ row: { ...(data as any), counterparty } });
}
