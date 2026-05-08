import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookieNames } from "@/lib/authCookies";

const publicRoutes = ["/", "/explore", "/property", "/terms", "/privacy"];
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(authCookieNames.accessToken)?.value;
  const isAuthenticated = !!token;

  // PUBLIC ROUTES
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // AUTH ROUTES (guest only)
  if (authRoutes.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // PRIVATE ROUTES (everything else)
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (public assets)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
