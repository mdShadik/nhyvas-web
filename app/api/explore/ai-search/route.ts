import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { analyzeQuery, AiMapping } from "@/lib/ai/queryAnalyzer";
import { generateEmbedding } from "@/lib/ai/embedding";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  try {
    const { query, lat, lng } = await req.json();
    if (!query) return jsonError("Query is required", 400);

    const supabase = (await getAuthenticatedClientOrNull()) ?? createSupabasePublicClient();

    // 1. Fetch dynamic mappings from admin config
    const { data: dynamicMappings } = await supabase
      .from("ai_query_mappings")
      .select("map_type, keyword, mapped_id, mapped_value, mapped_parent_id")
      .eq("is_active", true);

    // 2. Analyze query with dynamic mappings
    const analysis = analyzeQuery(query, (dynamicMappings as AiMapping[]) || []);

    // 3. Generate embedding server-side
    const embedding = await generateEmbedding(query);

    // 4. Perform Hybrid Search in Supabase
    const { data: listings, error } = await supabase.rpc("hybrid_property_search", {
      query_text: analysis.keywordQuery,
      query_embedding: embedding,
      p_limit: 40,
      p_offset: 0,
      p_categories: analysis.categories.length ? analysis.categories : null,
      p_subcategories: analysis.subcategories.length ? analysis.subcategories.map(s => s.subCategory_id) : null,
      p_min_price: analysis.budget.min,
      p_max_price: analysis.budget.max,
      p_user_lat: analysis.nearMe ? lat : null,
      p_user_lng: analysis.nearMe ? lng : null,
    });

    if (error) {
      console.error("Hybrid Search Error:", error);
      return jsonError(error.message, 500);
    }

    return jsonOk({
      listings: listings || [],
      analysis,
    });
  } catch (err: any) {
    console.error("AI Search Error:", err);
    return jsonError(err.message || "Internal server error", 500);
  }
}
