import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

type AmenityWithCategory = {
  id: string;
  name: string;
  code: string;
  category_id: string;
  category_name: string;
  category_code: string;
};

async function enrichAmenities(amenityIds: string[], supabase: ReturnType<typeof createSupabasePublicClient>): Promise<AmenityWithCategory[]> {
  if (!amenityIds.length) return [];
  const { data: amenities } = await supabase
    .from("master_amenities")
    .select("id, name, code, category_id")
    .in("id", amenityIds)
    .eq("is_active", true);

  if (!amenities?.length) return [];
  const catIds = [...new Set(amenities.map((a) => a.category_id).filter(Boolean))];
  const { data: categories } = await supabase
    .from("master_amenity_categories")
    .select("id, code, name")
    .in("id", catIds)
    .eq("is_active", true);

  const catMap = new Map(categories?.map((c) => [c.id, c]) ?? []);
  return amenities.map((a) => {
    const cat = catMap.get(a.category_id) ?? { name: "", code: "" };
    return {
      id: a.id,
      name: a.name,
      code: a.code,
      category_id: a.category_id,
      category_name: cat.name,
      category_code: cat.code,
    };
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_listing_details", { p_listing_id: listingId });
  if (error) return jsonError(error.message, 400);

  let row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    const result = await createSupabaseUserClientOrThrow();
    if (result.success) {
      const { data: modData } = await result.client
        .from("listing_moderation_queue")
        .select("*")
        .eq("id", listingId)
        .maybeSingle();
      if (modData) row = modData;
    }
  }

  const amenityIds = (row?.amenity_tags ?? []) as string[];
  const enrichedAmenities = await enrichAmenities(amenityIds, supabase);

  return jsonOk({ row: row ?? null, enrichedAmenities });
}

