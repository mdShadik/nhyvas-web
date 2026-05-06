import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { categoryCode?: string };
  const categoryCode = typeof body?.categoryCode === "string" ? body.categoryCode.trim() : "";
  if (!categoryCode) return jsonOk({ rows: [] });

  const supabase = createSupabasePublicClient();

  const { data: category, error: categoryError } = await supabase
    .from("master_property_categories")
    .select("id")
    .eq("is_active", true)
    .eq("code", categoryCode)
    .maybeSingle();
  if (categoryError) return jsonError(categoryError.message, 400);
  if (!category?.id) return jsonOk({ rows: [] });

  const { data, error } = await supabase
    .from("master_property_subcategories")
    .select("id, category_id, code, name, display_order")
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

