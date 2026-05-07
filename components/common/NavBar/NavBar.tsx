"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../ThemeToggle";
import darkLogo from "@/public/assets/images/logo-horizontal-d.png";
import lightLogo from "@/public/assets/images/logo-horizontal-l.png";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { MessageCircle, Heart, User, Bell, Search } from "lucide-react";

// Initialize client-side Supabase to check local session
const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);

export function NavBar() {
  const { theme } = useTheme();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="flex w-full items-center justify-between gap-4 py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src={logoUrl.src} alt="Nhyvas" width={120} height={60} className="object-contain" />
      </Link>
      
      <nav className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/explore"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
          >
            Explore
          </Link>
          
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/explore"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/chat"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    aria-label="Chat"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/shortlisted"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    aria-label="Shortlisted"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </Link>
                  <div className="ml-1 h-6 w-px bg-[var(--border)] hidden sm:block"></div>
                  <Link
                    href="/profile"
                    className="ml-1 sm:ml-2 flex items-center justify-center rounded-full border border-[var(--border)] p-0.5 transition hover:border-[var(--accent)]"
                    aria-label="Profile"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-input)]">
                      <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    </div>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 rounded-2xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent)]/90"
                >
                  Login
                </Link>
              )}
            </>
          )}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}