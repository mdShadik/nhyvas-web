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

export async function requestJson<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(url, {
    headers: {
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
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
