import { requestJson } from "@/services/apiService/http";

export type AuthAppRoute = "/(auth)/login" | "/(tabs)" | "/onboarding";

export function normalizeNepalPhone(phone: string): string {
  return phone.startsWith("+977") ? phone : `+977${phone.replace(/^0/, "")}`;
}

export async function sendOtp(phone: string): Promise<{ phone: string }> {
  const normalizedPhone = normalizeNepalPhone(phone);
  return await requestJson<{ phone: string }>("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: normalizedPhone }),
  });
}

export async function verifyOtp(phone: string, otp: string): Promise<void> {
  await requestJson("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
}

export async function logout(): Promise<void> {
  await requestJson("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUserId(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("nhyvas_user");
    if (cached) {
      try {
        const user = JSON.parse(cached);
        if (user?.id) return user.id;
      } catch {}
    }
  }
  const { user } = await requestJson<{ user: { id: string } | null }>("/api/auth/me", { method: "GET" });
  return user?.id ?? null;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const { profile } = await requestJson<{ profile: { role: string | null } | null }>("/api/profile/current", {
    method: "POST",
  });
  return profile?.role ?? null;
}

export function getCachedUserRoleForUserId(userId: string): string | null {
  void userId;
  return null;
}

export async function resolveAuthAppRoute(): Promise<AuthAppRoute> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return "/(auth)/login";
  }

  const role = await getCurrentUserRole();
  if (role === "user") return "/(tabs)";
  return "/onboarding";
}

export async function ensureProfileFromAuthUser(): Promise<void> {
  // Handled server-side in `/api/auth/verify-otp`.
}
