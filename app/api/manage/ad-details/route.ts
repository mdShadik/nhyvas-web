import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase
    .from("listing_moderation_queue")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();
  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError("Listing not found.", 404);
  return jsonOk({ row: data });
}

