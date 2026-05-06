import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { limit?: number; offset?: number };
  const limit = typeof body?.limit === "number" ? body.limit : 50;
  const offset = typeof body?.offset === "number" ? body.offset : 0;

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonOk({ rows: [] });

  const { data, error } = await supabase.rpc("get_app_saved_listings", {
    p_limit: Math.max(1, Math.min(Math.floor(limit), 200)),
    p_offset: Math.max(0, Math.floor(offset)),
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

