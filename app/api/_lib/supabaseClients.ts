import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export function createSupabasePublicClient() {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
