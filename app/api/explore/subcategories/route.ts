import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { categoryId?: string };
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId.trim() : "";
  if (!categoryId) return jsonOk({ rows: [] });

  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from("master_property_subcategories")
    .select("id, category_id, code, name, display_order")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

