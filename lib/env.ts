function getPublicEnv() {
  return {
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
    NEXT_PUBLIC_R2_SIGN_URL: process.env.NEXT_PUBLIC_R2_SIGN_URL,
    NEXT_PUBLIC_R2_UPLOAD_URL: process.env.NEXT_PUBLIC_R2_UPLOAD_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    NEXT_PUBLIC_NHYVAS_API_URL: process.env.NEXT_PUBLIC_NHYVAS_API_URL,
    NEXT_PUBLIC_USE_NHYVAS_AUTH: process.env.NEXT_PUBLIC_USE_NHYVAS_AUTH,
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

  r2PublicBaseUrl: requireEnv(raw.NEXT_PUBLIC_R2_PUBLIC_BASE_URL, "NEXT_PUBLIC_R2_PUBLIC_BASE_URL"),
  r2SignUrl: `${(raw.NEXT_PUBLIC_NHYVAS_API_URL ?? "http://localhost:8080").replace(/\/$/, "")}/api/v1/media/r2-sign`,
  r2UploadUrl: raw.NEXT_PUBLIC_R2_UPLOAD_URL ?? "",
  googleClientIdWeb: requireEnv(raw.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB, "NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB"),
  nhyvasApiUrl: (raw.NEXT_PUBLIC_NHYVAS_API_URL ?? "http://localhost:8080").replace(/\/$/, ""),
  useNhyvasAuth: true,
};
