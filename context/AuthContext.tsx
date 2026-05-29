"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { profileService, type AppProfile, type UserPreferences } from "@/services/apiService/profile";

const supabase = supabaseBrowser;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  // Use react-query for bootstrap data to ensure it's cached and consistent
  const { data: bootstrap, isLoading: isBootstrapLoading } = useQuery({
    queryKey: ["profile", "bootstrap"],
    queryFn: () => profileService.getBootstrap(),
    enabled: !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthLoading(false);
          
          if (session) {
            // Sync cookies on initial load if session exists to ensure server-side consistency
            fetch("/api/auth/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session }),
            }).catch(() => null);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthLoading(false);

        // Sync cookies on sign in or refresh to ensure server routes (like bootstrap) work
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            await fetch("/api/auth/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session }),
            }).catch(() => null);
          }
        } else if (event === "SIGNED_OUT") {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsAuthLoading(true);
    // Clear browser Supabase session (localStorage) and server cookies.
    await supabase.auth.signOut().catch(() => null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  };

  // The application is "loading" auth if either Supabase is initializing 
  // or if we have a session but haven't finished fetching the profile yet.
  const isLoading = isAuthLoading || (!!session && isBootstrapLoading);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        isLoading,
        session,
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
