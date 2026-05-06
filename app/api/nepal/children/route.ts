import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { parentId?: string; level?: string; limit?: number };
  const parentId = typeof body?.parentId === "string" ? body.parentId.trim() : "";
  const level = typeof body?.level === "string" ? body.level : "";
  const limit = typeof body?.limit === "number" ? body.limit : 5000;
  if (!parentId) return jsonError("parentId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("nepals_location_table")
    .select("id,name_en,level,parent_id,pcode")
    .eq("level", level)
    .eq("parent_id", parentId)
    .order("name_en", { ascending: true })
    .limit(Math.max(1, Math.min(Math.floor(limit), 10000)));
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

