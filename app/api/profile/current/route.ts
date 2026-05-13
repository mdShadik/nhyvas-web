import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST() {
  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonOk({ profile: null });

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonOk({ profile: null });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error) return jsonError(error.message, 400);
  return jsonOk({ profile: data ?? null });
}

