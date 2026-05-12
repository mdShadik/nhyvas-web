import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Single browser Supabase client (auth session + realtime). Use this everywhere
 * on the client so session and realtime share one instance.
 */
export const supabaseBrowser = createClient(env.supabaseUrl, env.supabasePublishableKey);
