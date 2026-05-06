import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/app/api/_lib/response";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { phone?: string };
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!phone) return jsonError("phone is required", 400);

  const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return jsonError(error.message, 400);

  return jsonOk({ phone });
}
