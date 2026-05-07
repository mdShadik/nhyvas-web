function getPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_KYC_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_KYC_BUCKET,
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
    NEXT_PUBLIC_R2_SIGN_URL: process.env.NEXT_PUBLIC_R2_SIGN_URL,
    NEXT_PUBLIC_R2_UPLOAD_URL: process.env.NEXT_PUBLIC_R2_UPLOAD_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  };
}

const raw = getPublicEnv();

function requireEnv(value: string | undefined, key: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  mode: (raw.NEXT_PUBLIC_ENV ?? "development") as
    | "development"
    | "staging"
    | "production",

  supabaseUrl: requireEnv(raw.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: requireEnv(
    raw.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ),
  supabaseKycBucket: requireEnv(raw.NEXT_PUBLIC_SUPABASE_KYC_BUCKET, "NEXT_PUBLIC_SUPABASE_KYC_BUCKET"),
  r2PublicBaseUrl: requireEnv(raw.NEXT_PUBLIC_R2_PUBLIC_BASE_URL, "NEXT_PUBLIC_R2_PUBLIC_BASE_URL"),
  r2SignUrl: requireEnv(raw.NEXT_PUBLIC_R2_SIGN_URL, "NEXT_PUBLIC_R2_SIGN_URL"),
  r2UploadUrl: raw.NEXT_PUBLIC_R2_UPLOAD_URL ?? "", // Optional for now
  googleClientIdWeb: requireEnv(raw.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB, "NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB"),
};