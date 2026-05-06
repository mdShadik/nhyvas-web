import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseUserClientOrThrow();
  } catch {
    return jsonOk({ user: null });
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) return jsonOk({ user: null });
  return jsonOk({ user: data.user ? { id: data.user.id } : null });
}

