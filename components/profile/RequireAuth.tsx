"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    const next = pathname?.startsWith("/") ? pathname : "/";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-bg-input" />
        <div className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-bg-input" />
          <div className="h-80 animate-pulse rounded-2xl bg-bg-input" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

