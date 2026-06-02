"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { env } from "@/lib/env";
import { nhyvasFetchMe } from "@/lib/nhyvasApi";
import { clearWebToken, getWebToken, requestJson } from "@/services/apiService/http";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { profileService, type AppProfile, type UserPreferences } from "@/services/apiService/profile";

export type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string | null };
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: null;
  user: AuthUser | null;
  profile: AppProfile | null;
  preferences: UserPreferences | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  session: null,
  user: null,
  profile: null,
  preferences: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const { data: bootstrap, isLoading: isBootstrapLoading } = useQuery({
    queryKey: ["profile", "bootstrap"],
    queryFn: () => profileService.getBootstrap(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const token = getWebToken();
        if (!token) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsAuthLoading(false);
          }
          return;
        }

        const me = await nhyvasFetchMe(token);
        if (mounted) {
          setIsAuthenticated(true);
          setUser({
            id: me.id,
            email: me.email,
            user_metadata: { full_name: me.full_name },
          });
          setIsAuthLoading(false);
        }
      } catch {
        clearWebToken();
        if (mounted) {
          setIsAuthenticated(false);
          setIsAuthLoading(false);
        }
      }
    }

    void getInitialSession();
    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    setIsAuthLoading(true);
    clearWebToken();
    setIsAuthenticated(false);
    setUser(null);
    await requestJson("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  };

  const isLoading = isAuthLoading || (isAuthenticated && isBootstrapLoading);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        session: null,
        user,
        profile: bootstrap?.profile ?? null,
        preferences: bootstrap?.preferences ?? null,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
