import { create } from "zustand";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Track if logout is in progress to prevent race conditions
let isLoggingOut = false;

// Zustand store for auth state (used by client interceptor)
interface AuthState {
  isLoggingOut: boolean;
  setLoggingOut: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggingOut: false,
  setLoggingOut: (value: boolean) => set({ isLoggingOut: value }),
}));

const AUTH_401_MARKERS = [
  "expired",
  "session",
  "logged in",
  "unauthorized",
  "unauthenticated",
  "invalid token",
  "refresh token",
];

function isAuthFailureMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return AUTH_401_MARKERS.some((marker) => normalized.includes(marker));
}

// Trigger logout on the client - call this when session is expired or invalid
async function handleUnauthorized() {
  if (isLoggingOut) return;
  isLoggingOut = true;
  useAuthStore.getState().setLoggingOut(true);

  try {
    if (typeof window !== "undefined") {
      // Redirect to logout page to clear session properly
      window.location.href = "/logout?expired=true";
    }
  } finally {
    if (typeof window === "undefined") {
      isLoggingOut = false;
      useAuthStore.getState().setLoggingOut(false);
    }
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_NHYVAS_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export function toV1ApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/api/")) {
    return `${API_BASE}/api/v1${url.slice(4)}`;
  }
  return url;
}

const WEB_TOKEN_KEY = "nhyvas_at";

export function getWebToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WEB_TOKEN_KEY);
}

export function setWebToken(token: string) {
  localStorage.setItem(WEB_TOKEN_KEY, token);
}

export function clearWebToken() {
  localStorage.removeItem(WEB_TOKEN_KEY);
}

export async function requestJson<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const token = getWebToken();
  const response = await fetch(toV1ApiUrl(url), {
    headers: {
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  // Handle 401 Unauthorized - session expired or not logged in
  if (response.status === 401) {
    const body = await response.json().catch(() => null);
    const message = body?.error ?? "You need to be logged in.";
    
    if (isAuthFailureMessage(message)) {
      handleUnauthorized();
    }
    
    throw new ApiError(message, response.status);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  return body as TResponse;
}

// Utility to make a request with explicit 401 handling
export async function requestWithAuthCheck<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  return requestJson<TResponse>(url, init);
}
