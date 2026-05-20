import { NextResponse } from "next/server";

import { authCookieNames } from "@/lib/authCookies";
import { env } from "@/lib/env";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const base = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: env.mode === "production",
    expires: new Date(0),
    maxAge: 0,
  };

  // Important: match cookie attributes (path/samesite/secure) to reliably clear in all browsers.
  res.cookies.set(authCookieNames.accessToken, "", base);
  res.cookies.set(authCookieNames.refreshToken, "", base);
  return res;
}
