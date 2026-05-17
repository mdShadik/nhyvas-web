import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { authCookieNames } from "@/lib/authCookies";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const session = body?.session;

  if (!session || !session.access_token || !session.user) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const user = session.user;

  // Check if profile exists and if role is "user"
  let needsOnboarding = true;

  try {
    const userClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    });

    const { data: existingProfile } = await userClient
      .from("profiles")
      .select("is_onboarded")
      .eq("id", user.id)
      .single();

    if (existingProfile?.is_onboarded) {
      needsOnboarding = false;
    } else {
      // Ensure profile exists (server-side upsert) for new or pending users
      const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
      const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

      await userClient.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          phone: user.phone ?? null,
          full_name: fullName,
          avatar_url: avatarUrl,
          profile_type: "app_user",
        },
        { onConflict: "id" }
      );
    }
  } catch (err) {
    console.error("Profile check/upsert failed during auth callback:", err);
    // Non-fatal, proceed with login (force onboard)
  }

  const res = NextResponse.json({ success: true, onboard: needsOnboarding });

  // Set secure cookies for our application
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
