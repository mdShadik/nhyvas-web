import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { categoryId?: string; categoryIds?: string[] };
  const categoryIds = Array.isArray(body?.categoryIds) 
    ? body.categoryIds 
    : (typeof body?.categoryId === "string" && body.categoryId.trim() ? [body.categoryId.trim()] : []);
    
  if (categoryIds.length === 0) return jsonOk({ rows: [] });

  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from("master_property_subcategories")
    .select("id, category_id, code, name, display_order")
    .eq("is_active", true)
    .in("category_id", categoryIds)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

