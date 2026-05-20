import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    propertyId?: string;
    mediaUrl?: string;
    thumbnailUrl?: string | null;
    mediaKey?: string;
    thumbnailKey?: string;
  };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
  const mediaKey = typeof body?.mediaKey === "string" ? body.mediaKey.trim() : null;
  const thumbnailKey = typeof body?.thumbnailKey === "string" ? body.thumbnailKey.trim() : null;
  if (!propertyId) return jsonError("propertyId is required", 400);
  if (!mediaUrl) return jsonError("mediaUrl is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("upsert_my_property_story", {
    p_property_id: propertyId,
    p_media_url: mediaUrl,
    p_thumbnail_url: typeof body?.thumbnailUrl === "string" ? body.thumbnailUrl : null,
    p_media_key: mediaKey,
    p_thumbnail_key: thumbnailKey,
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ id: data as string });
}
