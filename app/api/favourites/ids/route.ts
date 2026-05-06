import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

const FAVOURITES_TABLE = "user_listing_favourites";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingIds?: string[] };
  const listingIds = Array.isArray(body?.listingIds) ? body!.listingIds.filter((x) => typeof x === "string") : [];
  if (listingIds.length === 0) return jsonOk({ ids: [] });

  let supabase;
  try {
    supabase = await createSupabaseUserClientOrThrow();
  } catch {
    return jsonOk({ ids: [] });
  }

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonOk({ ids: [] });

  const { data, error } = await supabase
    .from(FAVOURITES_TABLE)
    .select("listing_id")
    .eq("user_id", userId)
    .in("listing_id", listingIds);

  if (error) return jsonError(error.message, 400);
  return jsonOk({ ids: (data ?? []).map((r: any) => r.listing_id) });
}

