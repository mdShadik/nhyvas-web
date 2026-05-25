import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { authCookieNames } from "@/lib/authCookies";


const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Token expiration codes that indicate session is completely invalid
const INVALID_SESSION_ERRORS = [
  "refresh_token",
  "session",
  "invalid_token",
  "token",
  "expired",
];

/**
 * Checks if an error indicates an invalid/expired session that requires logout
 */
function isSessionExpiredError(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return INVALID_SESSION_ERRORS.some((code) => message.includes(code));
}

export async function getRequestAuthTokens(): Promise<
  | { accessToken: string; refreshToken: string }
  | { accessToken: null; refreshToken: null }
> {
  const jar = await cookies();
  const accessToken = jar.get(authCookieNames.accessToken)?.value ?? null;
  const refreshToken = jar.get(authCookieNames.refreshToken)?.value ?? null;
  if (!accessToken || !refreshToken) return { accessToken: null, refreshToken: null };
  return { accessToken, refreshToken };
}

/**
 * Clears authentication cookies (call this when session is invalid)
 */
export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(authCookieNames.accessToken);
  jar.delete(authCookieNames.refreshToken);
}

async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const jar = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.mode === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };

  jar.set(authCookieNames.accessToken, accessToken, cookieOptions);
  jar.set(authCookieNames.refreshToken, refreshToken, cookieOptions);
}

/**
 * Result type for createSupabaseUserClientOrThrow that indicates session status
 */
export type AuthResult =
  | { success: true; client: SupabaseClient; refreshed: boolean }
  | { success: false; error: "expired" | "unauthenticated" };

/**
 * Creates an authenticated Supabase client for the current request.
 * Automatically refreshes tokens if needed.
 * Returns an AuthResult to properly handle session expiration.
 */
export async function createSupabaseUserClientOrThrow(): Promise<AuthResult> {
  const { accessToken, refreshToken } = await getRequestAuthTokens();
  if (!accessToken || !refreshToken) {
    return { success: false, error: "unauthenticated" };
  }

  const client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Refresh if needed.
  let refreshed = false;
  try {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      // Check if this is a session expiration error
      if (isSessionExpiredError(error)) {
        await clearAuthCookies();
        return { success: false, error: "expired" };
      }
      throw error;
    }

    // Token was refreshed - update cookies if new tokens provided
    if (data.session?.access_token && data.session?.refresh_token) {
      // Only update cookies if tokens actually changed
      if (
        data.session.access_token !== accessToken ||
        data.session.refresh_token !== refreshToken
      ) {
        refreshed = true;
        await setAuthCookies(data.session.access_token, data.session.refresh_token);
      }
    } else {
      await clearAuthCookies();
      return { success: false, error: "expired" };
    }
  } catch (err) {
    // Check if this is a session expiration error
    if (err instanceof Error && isSessionExpiredError(err)) {
      await clearAuthCookies();
      return { success: false, error: "expired" };
    }
    // For other errors, let downstream fail with 401 from Supabase
  }

  return { success: true, client, refreshed };
}

/**
 * @deprecated Use createSupabaseUserClientOrThrow() instead for proper error handling
 * This function is kept for backward compatibility
 */
export async function createSupabaseUserClientOrThrowLegacy(): Promise<SupabaseClient> {
  const result = await createSupabaseUserClientOrThrow();
  if (!result.success) {
    throw new Error(result.error === "expired" ? "Session expired" : "UNAUTHENTICATED");
  }
  return result.client;
}
