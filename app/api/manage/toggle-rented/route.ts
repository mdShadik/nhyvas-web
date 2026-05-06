import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string; isRented?: boolean };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  const isRented = Boolean(body?.isRented);
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.from("listing_moderation_queue").update({ is_rented: isRented }).eq("id", propertyId);
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}

