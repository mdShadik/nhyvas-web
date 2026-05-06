import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

const FAVOURITES_TABLE = "user_listing_favourites";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.from(FAVOURITES_TABLE).delete().eq("user_id", userId).eq("listing_id", listingId);
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}

