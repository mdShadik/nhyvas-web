"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";
import darkLogo from "@/public/assets/images/logo-horizontal-d.png";
import lightLogo from "@/public/assets/images/logo-horizontal-l.png";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  MessageCircle,
  Heart,
  User,
  Bell,
  Search,
  Home,
  Compass,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import logoAnimation from "@/public/assets/json/logo.json";

const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);

const BRAND_ANIMATION_KEY = "nhyvas-navbar-logo-played";
const BRAND_ANIMATION_DURATION = 2200;

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLogo({ playTrigger }: { playTrigger: number }) {
  const { theme } = useTheme();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  const [showAnimated, setShowAnimated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let shouldPlay = false;

    if (playTrigger > 0) {
      shouldPlay = true;
    } else {
      try {
        const hasPlayed = window.sessionStorage.getItem(BRAND_ANIMATION_KEY) === "1";
        if (!hasPlayed) {
          shouldPlay = true;
          window.sessionStorage.setItem(BRAND_ANIMATION_KEY, "1");
        }
      } catch {
        shouldPlay = false;
      }
    }

    if (shouldPlay) {
      setShowAnimated(true);
      const timer = window.setTimeout(() => {
        setShowAnimated(false);
      }, BRAND_ANIMATION_DURATION);
      return () => window.clearTimeout(timer);
    } else {
      setShowAnimated(false);
    }
  }, [playTrigger]);

  if (mounted && showAnimated) {
    return (
      <div className="h-10 w-[132px] overflow-hidden sm:h-11 sm:w-[144px]">
        <DotLottieReact
          data={logoAnimation}
          autoplay
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt="Nhyvas"
      priority
      width={144}
      height={44}
      className="h-10 w-auto object-contain sm:h-11"
    />
  );
}

function MainNavLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-200",
        active
          ? "bg-[var(--accent)]/12 text-[var(--accent)] shadow-sm"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]",
      ].join(" ")}
    >
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function IconAction({
  href,
  label,
  active = false,
  children,
  className = "",
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
        active
          ? "border-[var(--accent)]/20 bg-[var(--accent)]/12 text-[var(--accent)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playTrigger, setPlayTrigger] = useState(0);

  const handleHomeClick = () => {
    setPlayTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
      { href: "/explore", label: "Explore", icon: <Compass className="h-4 w-4" /> },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-colors dark:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-[var(--color-tertiary-500)]/5" />

          <div className="relative flex h-16 items-center justify-between gap-3 px-3 sm:h-[72px] sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                aria-label="Go to homepage"
                onClick={handleHomeClick}
              >
                <BrandLogo playTrigger={playTrigger} />
              </Link>

              <div className="hidden md:flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-input)]/80 p-1">
                {navLinks.map((item) => (
                  <MainNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isRouteActive(pathname, item.href)}
                    onClick={item.href === "/" ? handleHomeClick : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <IconAction
                href="/explore"
                label="Search"
                active={isRouteActive(pathname, "/explore")}
              >
                <Search className="h-4.5 w-4.5" />
              </IconAction>

              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              <div className="hidden sm:block h-6 w-px bg-[var(--color-border)]" />

              {isLoading ? (
                <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--color-bg-input)]" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <IconAction
                    href="/chat"
                    label="Chat"
                    active={isRouteActive(pathname, "/chat")}
                    className="hidden md:flex"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                  </IconAction>

                  <IconAction
                    href="/shortlisted"
                    label="Shortlisted"
                    active={isRouteActive(pathname, "/shortlisted")}
                    className="hidden sm:flex"
                  >
                    <Heart className="h-4.5 w-4.5" />
                  </IconAction>

                  <IconAction
                    href="/notifications"
                    label="Notifications"
                    active={isRouteActive(pathname, "/notifications")}
                  >
                    <Bell className="h-4.5 w-4.5" />
                  </IconAction>

                  <div className="hidden sm:block h-6 w-px bg-[var(--color-border)]" />

                  <Link
                    href="/profile"
                    aria-current={isRouteActive(pathname, "/profile") ? "page" : undefined}
                    className={[
                      "flex h-10 items-center gap-2 rounded-full border px-1 pr-3 transition-all duration-200",
                      isRouteActive(pathname, "/profile")
                        ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:border-[var(--accent)]/20 hover:text-[var(--color-text-primary)]",
                    ].join(" ")}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-card)]">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">Profile</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-1 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  Login
                </Link>
              )}

              <div className="sm:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] px-3 py-2 md:hidden">
            <div className="flex items-center gap-1 overflow-x-auto">
              {navLinks.map((item) => (
                <MainNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isRouteActive(pathname, item.href)}
                  onClick={item.href === "/" ? handleHomeClick : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}