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

let mePromise: Promise<string | null> | null = null;

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

  if (mePromise) return mePromise;

  mePromise = (async () => {
    try {
      const { user } = await requestJson<{ user: { id: string } | null }>("/api/auth/me", { method: "GET" });
      const id = user?.id ?? null;
      // If we got a fresh ID, we don't necessarily update localStorage here 
      // because AuthContext usually handles the full user object.
      return id;
    } catch {
      return null;
    } finally {
      // Clear promise after a short while or immediately so next explicit call can retry if needed
      setTimeout(() => { mePromise = null; }, 5000);
    }
  })();

  return mePromise;
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
