import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserIdOrThrow(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}

