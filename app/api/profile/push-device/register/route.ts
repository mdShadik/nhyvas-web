import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";

/**
 * Registers or updates a push device for the current user.
 * Supports iOS, Android, and Web platforms.
 */
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedClientAndUserIdOrRespond();
    if ("status" in authResult) return authResult;
    const { client: supabase, userId } = authResult;

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON body.", 400);

    const { expoPushToken, deviceId, platform, appVersion, appBuild } = body;

    if (!expoPushToken) {
      return jsonError("expoPushToken is required.", 400);
    }

    if (!platform || !["ios", "android", "web"].includes(platform)) {
      return jsonError("Invalid or missing platform. Must be 'ios', 'android', or 'web'.", 400);
    }

    // Call the database function to handle upsert and RLS bypass if needed.
    // Note: upsert_push_device was defined in migration 20260504100000_push_queue.sql
    const { data, error } = await supabase.rpc("upsert_push_device", {
      p_expo_push_token: expoPushToken,
      p_device_id: deviceId || null,
      p_platform: platform,
      p_app_version: appVersion || null,
      p_app_build: appBuild || null,
    });

    if (error) {
      // Fallback to manual upsert if RPC fails for some reason (e.g. not yet deployed)
      const { error: upsertError } = await supabase.from("push_devices").upsert(
        {
          user_id: userId,
          expo_push_token: expoPushToken,
          device_id: deviceId || null,
          platform,
          app_version: appVersion || null,
          app_build: appBuild || null,
          enabled: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "expo_push_token" }
      );

      if (upsertError) return jsonError(upsertError.message, 400);
    }

    return jsonOk({ ok: true, id: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return jsonError(message, 500);
  }
}
