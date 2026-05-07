import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { authCookieNames } from "@/lib/authCookies";
import { createSupabaseAdminClient } from "@/server/supabase";

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
    const admin = createSupabaseAdminClient();
    const { data: existingProfile } = await admin
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

      await admin.from("profiles").upsert(
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
