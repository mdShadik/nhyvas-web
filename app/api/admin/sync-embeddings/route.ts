import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrRespond } from "@/app/api/_lib/supabase";
import { buildSearchablePropertyText, generateEmbedding } from "@/lib/ai/embedding";

export async function POST(req: Request) {
  const authResult = await getAuthenticatedClientOrRespond();
  if (authResult instanceof Response) return authResult;
  const supabase = authResult;

  // 1. Fetch listings that need embeddings
  const { data: listings, error } = await supabase
    .from("listing_moderation_queue")
    .select("id, property_title, description, property_category, subcategory, location_text, amenity_tags")
    .is("embedding", null)
    .limit(50); // Process in batches to avoid timeouts

  if (error) return jsonError(error.message, 500);
  if (!listings || listings.length === 0) return jsonOk({ message: "No listings need embedding sync." });

  const results = {
    total: listings.length,
    success: 0,
    failed: 0,
  };

  for (const listing of listings) {
    try {
      const searchableText = buildSearchablePropertyText({
        title: listing.property_title,
        description: listing.description,
        category: listing.property_category,
        subcategory: listing.subcategory,
        location_text: listing.location_text,
        amenity_tags: listing.amenity_tags,
      });

      const embedding = await generateEmbedding(searchableText);

      const { error: updateError } = await supabase
        .from("listing_moderation_queue")
        .update({ embedding })
        .eq("id", listing.id);

      if (updateError) {
        console.error(`Failed to update embedding for ${listing.id}:`, updateError);
        results.failed++;
      } else {
        results.success++;
      }
    } catch (err) {
      console.error(`Error processing ${listing.id}:`, err);
      results.failed++;
    }
  }

  return jsonOk(results);
}
