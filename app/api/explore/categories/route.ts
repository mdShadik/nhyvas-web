import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { limit?: number };
  const limit = typeof body?.limit === "number" ? body.limit : 12;
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("master_property_categories")
    .select("id, code, name, description, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(safeLimit);

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

