import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string; isRented?: boolean };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  const isRented = Boolean(body?.isRented);
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const updateData: any = { is_rented: isRented };
  if (!isRented) {
    updateData.status = "pending_review";
  }

  const { error } = await supabase.from("listing_moderation_queue").update(updateData).eq("id", propertyId);
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}

