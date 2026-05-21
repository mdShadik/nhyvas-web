import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";
import { buildSearchablePropertyText, generateEmbedding } from "@/lib/ai/embedding";

type UpsertListingBody = {
  listingId?: string | null;
  property_category?: string | null;
  category_id?: string | null;
  subcategory?: string | null;
  subcategory_id?: string | null;
  property_title?: string | null;
  description?: string | null;
  price?: number | string | null;
  is_negotiable?: boolean | null;
  total_area_sqft?: number | null;
  carpet_area_sqft?: number | null;
  total_floor?: number | null;
  property_floor_no?: number | null;
  state_id?: string | null;
  district_id?: string | null;
  municipality_id?: string | null;
  ward_id?: string | null;
  location_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Contact phone for this listing (stored as landlord_phone). Required if profile has no phone. */
  landlord_phone?: string | null;
  thumbnail_url?: string | null;
  photo_urls?: string[] | null;
  amenity_tags?: string[] | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as UpsertListingBody | null;
  if (!body) return jsonError("Invalid JSON body.", 400);

  const authResult = await getAuthenticatedClientAndUserIdOrRespond();
  if ("status" in authResult) {
    // It's an error Response
    return authResult;
  }
  const { client: supabase, userId } = authResult;

  const listingId = asString(body.listingId);
  const isEdit = Boolean(listingId);

  const property_category = asString(body.property_category);
  const property_title = asString(body.property_title);
  const description = asString(body.description);
  const location_text = asString(body.location_text);

  const price = asNumber(body.price);
  if (!property_category) return jsonError("property_category is required", 400);
  if (!property_title) return jsonError("property_title is required", 400);
  if (!description) return jsonError("description is required", 400);
  if (price == null) return jsonError("price is required", 400);
  if (!location_text) return jsonError("location_text is required", 400);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return jsonError(profileError.message, 400);

  const landlord_phone =
    asString(body.landlord_phone) || asString(profile?.phone) || "";
  if (!landlord_phone) {
    return jsonError("Phone number is required. Add it here or in your profile.", 400);
  }
  const landlord_name = asString(profile?.full_name) || "Landlord";

  const amenity_tags =
    Array.isArray(body.amenity_tags) ? body.amenity_tags.map((v) => asString(v)).filter(Boolean) : [];
  const photo_urls = Array.isArray(body.photo_urls) ? body.photo_urls.map((v) => asString(v)).filter(Boolean) : [];

  // Generate embedding for AI search
  let embedding: number[] | null = null;
  try {
    const searchableText = buildSearchablePropertyText({
      title: property_title,
      description,
      category: property_category,
      subcategory: body.subcategory,
      location_text,
      amenity_tags,
    });
    embedding = await generateEmbedding(searchableText);
  } catch (err) {
    console.error("Failed to generate embedding during upsert:", err);
    // Continue without embedding rather than failing the whole upsert
  }

  const basePayload = {
    property_category,
    category_id: body.category_id || null,
    subcategory: body.subcategory != null ? asString(body.subcategory) || null : null,
    subcategory_id: body.subcategory_id || null,
    property_title,
    description,
    price,
    is_negotiable: body.is_negotiable ?? true,
    total_area_sqft: body.total_area_sqft ?? null,
    carpet_area_sqft: body.carpet_area_sqft ?? null,
    total_floor: body.total_floor ?? null,
    property_floor_no: body.property_floor_no ?? null,
    state_id: body.state_id ?? null,
    district_id: body.district_id ?? null,
    municipality_id: body.municipality_id ?? null,
    ward_id: body.ward_id ?? null,
    location_text,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    thumbnail_url: body.thumbnail_url != null ? asString(body.thumbnail_url) || null : null,
    photo_urls,
    amenity_tags,
    landlord_name,
    landlord_phone,
    listed_by: userId,
    embedding: embedding, // Store the generated vector
  };

  /** Landlords cannot toggle premium map/story flags; admin sets these on the listing. */
  const insertPayload = {
    ...basePayload,
    show_exact_location: false,
    is_story: false,
  };

  if (isEdit) {
    const { data: existing, error: existingError } = await supabase
      .from("listing_moderation_queue")
      .select("id, status")
      .eq("id", listingId)
      .eq("listed_by", userId)
      .maybeSingle();
    if (existingError) return jsonError(existingError.message, 400);
    if (!existing) return jsonError("Listing not found.", 404);

    if (existing.status !== "pending" && existing.status !== "changes_requested") {
      return jsonError("Edit not allowed. Only pending and changes requested listings can be edited.", 403);
    }

    const { error } = await supabase
      .from("listing_moderation_queue")
      .update(basePayload)
      .eq("id", listingId)
      .eq("listed_by", userId);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ id: listingId });
  }

  const { data, error } = await supabase
    .from("listing_moderation_queue")
    .insert({
      ...insertPayload,
      status: "pending",
    })
    .select("id")
    .maybeSingle();
  if (error) return jsonError(error.message, 400);

  return jsonOk({ id: data?.id ?? null });
}
