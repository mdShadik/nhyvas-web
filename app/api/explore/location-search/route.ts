import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { query?: string; limit?: number; level?: string };
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) return jsonOk({ rows: [] });

  const limit = typeof body?.limit === "number" ? body.limit : 30;
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 200));
  const level = typeof body?.level === "string" ? body.level.trim() : null;

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("search_nepals_location_nodes", {
    p_query: query.replace(/\s+/g, " ").trim(),
    p_limit: safeLimit,
    p_level: level,
  });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}
