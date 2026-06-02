declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_ENV?: "development" | "staging" | "production";
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL?: string;
    NEXT_PUBLIC_R2_SIGN_URL?: string;
    NEXT_PUBLIC_TOMTOM_KEY?: string;
    NEXT_PUBLIC_TOMTOM_STYLE_URL?: string;
    NEXT_PUBLIC_TOMTOM_STYLE_ID?: string;
    NEXT_PUBLIC_PWA_PROMPT_INTERVAL_MINUTES?: string;
    
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_API_TOKEN?: string;

    // Back-compat with the mobile app env naming
    EXPO_PUBLIC_ENV?: "development" | "staging" | "production";
    EXPO_PUBLIC_R2_PUBLIC_BASE_URL?: string;
    EXPO_PUBLIC_R2_SIGN_URL?: string;
    EXPO_PUBLIC_TOMTOM_KEY?: string;
    EXPO_PUBLIC_TOMTOM_STYLE_URL?: string;
    EXPO_PUBLIC_TOMTOM_STYLE_ID?: string;

  }
}
