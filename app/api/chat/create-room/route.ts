import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string; otherUserId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  const otherUserId = typeof body?.otherUserId === "string" ? body.otherUserId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);
  if (!otherUserId) return jsonError("otherUserId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("get_or_create_chat_room", {
    p_listing_id: listingId,
    p_other_user_id: otherUserId,
  });
  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError("Failed to open chat room.", 400);
  return jsonOk({ roomId: data as string });
}

