import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { limit?: number };
  const limit = typeof body?.limit === "number" ? body.limit : 8;
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50));

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_home_listings", { p_limit: safeLimit });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

