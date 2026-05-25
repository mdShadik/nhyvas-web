import { type SupabaseClient } from "@supabase/supabase-js";
import { jsonError } from "./response";
import {
  createSupabaseUserClientOrThrow,
  clearAuthCookies,
} from "@/server/supabase";


/**
 * Authentication helper that returns a standardized response
 * and handles session expiration properly
 */
export async function requireAuthenticatedClient(): Promise<
  Awaited<ReturnType<typeof createSupabaseUserClientOrThrow>>
> {
  const result = await createSupabaseUserClientOrThrow();
  return result;
}

/**
 * Backward-compatible wrapper for API routes.
 * Returns the client on success, or null on failure (like the old pattern).
 * But also clears auth cookies and sends proper error when session is expired.
 * 
 * Usage: Replace `const supabase = await createSupabaseUserClientOrThrow().catch(() => null);`
 *        with `const supabase = await getAuthenticatedClientOrNull();`
 */
export async function getAuthenticatedClientOrNull(): Promise<SupabaseClient | null> {
  const result = await createSupabaseUserClientOrThrow();

  if (!result.success) {
    if (result.error === "expired") {
      // Clear cookies so client also gets logged out
      await clearAuthCookies();
    }
    return null;
  }

  return result.client;
}

/**
 * Wrapper for API routes that need authentication.
 * Returns the client on success, or sends a 401 error response and returns null on failure.
 * If session is expired, also clears auth cookies.
 */
export async function getAuthenticatedClientOrRespond() {
  const result = await createSupabaseUserClientOrThrow();

  if (!result.success) {
    if (result.error === "expired") {
      // Clear cookies so client also gets logged out
      await clearAuthCookies();
      return jsonError("Session expired. Please login again.", 401);
    }
    return jsonError("You need to be logged in.", 401);
  }

  return result.client;
}

/**
 * For API routes that need user ID after authentication check
 */
export async function getAuthenticatedClientAndUserIdOrRespond(): Promise<
  | { client: SupabaseClient; userId: string }
  | ReturnType<typeof jsonError>
> {
  const result = await createSupabaseUserClientOrThrow();

  if (!result.success) {
    if (result.error === "expired") {
      await clearAuthCookies();
      return jsonError("Session expired. Please login again.", 401);
    }
    return jsonError("You need to be logged in.", 401);
  }

  const {
    data: { user },
    error: userError,
  } = await result.client.auth.getUser();

  if (userError || !user) {
    return jsonError("Unable to verify user session.", 401);
  }

  return { client: result.client, userId: user.id };
}
