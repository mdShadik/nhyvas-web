import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { level?: string; query?: string; limit?: number };
  const level = typeof body?.level === "string" ? body.level : "";
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const limit = typeof body?.limit === "number" ? body.limit : 20;
  if (!query) return jsonOk({ rows: [] });

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("nepals_location_table")
    .select("id,name_en,level,parent_id,pcode")
    .eq("level", level)
    .ilike("name_en", `%${query}%`)
    .limit(Math.max(1, Math.min(Math.floor(limit), 200)));
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

