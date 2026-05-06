import { NextResponse } from "next/server";

import { authCookieNames } from "@/lib/authCookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieNames.accessToken, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(authCookieNames.refreshToken, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

