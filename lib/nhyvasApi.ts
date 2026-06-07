import { requestJson } from "@/services/apiService/http";

const DEFAULT_API_URL = "http://localhost:8080";

export function getNhyvasApiUrl(): string {
  const url =
    process.env.NHYVAS_API_URL ??
    process.env.NEXT_PUBLIC_NHYVAS_API_URL ??
    DEFAULT_API_URL;
  return url.replace(/\/$/, "");
}

export type NhyvasMe = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  profile_type: string;
  is_onboarded: boolean;
};

export async function nhyvasGoogleLogin(idToken: string): Promise<{ token: string; refresh_token?: string }> {
	const res = await fetch(`${getNhyvasApiUrl()}/api/v1/auth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id_token: idToken }),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data.error ?? "Google authentication failed");
	}
	return data as { token: string; refresh_token?: string };
}

export async function nhyvasFetchMe(): Promise<NhyvasMe> {
  return await requestJson<NhyvasMe>("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });
}

export function useNhyvasAuth(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_NHYVAS_AUTH === "true" ||
    Boolean(process.env.NEXT_PUBLIC_NHYVAS_API_URL?.trim())
  );
}
