"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { env } from "@/lib/env";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={env.googleClientIdWeb}>
      {children}
    </GoogleOAuthProvider>
  );
}
