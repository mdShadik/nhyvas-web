import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function GET() {
  const result = await createSupabaseUserClientOrThrow();
  if (!result.success) return jsonOk({ user: null });

  const { data, error } = await result.client.auth.getUser();
  if (error) return jsonOk({ user: null });
  return jsonOk({ user: data.user ? { id: data.user.id } : null });
}

