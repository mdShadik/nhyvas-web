import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { authCookieNames } from "@/lib/authCookies";

function assertServiceRoleKey(): string {
  if (!env.supabaseServiceRoleKey) {
    throw new Error("Missing server env var: SUPABASE_SERVICE_ROLE_KEY");
  }
  return env.supabaseServiceRoleKey;
}

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(env.supabaseUrl, assertServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getRequestAuthTokens():
  | { accessToken: string; refreshToken: string }
  | { accessToken: null; refreshToken: null } {
  const jar = cookies();
  const accessToken = jar.get(authCookieNames.accessToken)?.value ?? null;
  const refreshToken = jar.get(authCookieNames.refreshToken)?.value ?? null;
  if (!accessToken || !refreshToken) return { accessToken: null, refreshToken: null };
  return { accessToken, refreshToken };
}

export async function createSupabaseUserClientOrThrow(): Promise<SupabaseClient> {
  const { accessToken, refreshToken } = getRequestAuthTokens();
  if (!accessToken || !refreshToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Refresh if needed (best-effort).
  try {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }

    if (data.session?.access_token && data.session?.refresh_token) {
      const jar = cookies();
      jar.set(authCookieNames.accessToken, data.session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.mode === "production",
        path: "/",
      });
      jar.set(authCookieNames.refreshToken, data.session.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.mode === "production",
        path: "/",
      });
    }
  } catch {
    // If refresh fails, keep the existing token and let downstream fail with 401 from Supabase.
  }

  return client;
}

