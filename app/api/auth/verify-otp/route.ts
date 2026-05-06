import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { authCookieNames } from "@/lib/authCookies";
import { jsonError } from "@/app/api/_lib/response";
import { createSupabaseAdminClient } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { phone?: string; otp?: string };
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if (!phone) return jsonError("phone is required", 400);
  if (!otp) return jsonError("otp is required", 400);

  const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
  if (error) return jsonError(error.message, 400);

  const session = data.session;
  const user = data.user;
  if (!session || !user) return jsonError("Failed to create session", 400);

  // Optional: ensure profile exists (server-side upsert)
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        profile_type: "app_user",
      },
      { onConflict: "id" }
    );
  } catch {
    // Non-fatal
  }

  const res = NextResponse.json({ user: { id: user.id } });
  res.cookies.set(authCookieNames.accessToken, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.mode === "production",
    path: "/",
  });
  res.cookies.set(authCookieNames.refreshToken, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.mode === "production",
    path: "/",
  });
  return res;
}

