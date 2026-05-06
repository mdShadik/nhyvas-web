import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase
    .from("listing_moderation_queue")
    .select("*")
    .eq("id", propertyId)
    .eq("listed_by", userId)
    .maybeSingle();
  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError("Listing not found.", 404);
  return jsonOk({ row: data });
}

