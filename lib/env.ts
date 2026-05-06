function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readRequiredEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = readEnv(key);
    if (value) return value;
  }
  throw new Error(`Missing required env var (tried: ${keys.join(", ")})`);
}

export const env = {
  mode: (readEnv("NEXT_PUBLIC_ENV") ?? readEnv("EXPO_PUBLIC_ENV") ?? "development") as
    | "development"
    | "staging"
    | "production",

  // Public (browser-safe)
  supabaseUrl: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ),
  supabaseKycBucket: readRequiredEnv("NEXT_PUBLIC_SUPABASE_KYC_BUCKET", "EXPO_PUBLIC_SUPABASE_KYC_BUCKET"),
  r2PublicBaseUrl: readRequiredEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL", "EXPO_PUBLIC_R2_PUBLIC_BASE_URL"),
  r2SignUrl: readRequiredEnv("NEXT_PUBLIC_R2_SIGN_URL", "EXPO_PUBLIC_R2_SIGN_URL"),

  // Server-only
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

