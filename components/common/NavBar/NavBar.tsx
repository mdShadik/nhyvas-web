"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";
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
    Building,
    Building2,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { darkLogo, lightLogo, logoAnimation } from "@/assets";
import { LanguageToggle } from "../LanguageToggle";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { getUnreadCount } from "@/services/notifications";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { motion } from "framer-motion";

const BRAND_ANIMATION_KEY = "nhyvas-navbar-logo-played";
const BRAND_ANIMATION_DURATION = 2200;

function isRouteActive(pathname: string, href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLogo({ playTrigger }: { playTrigger: number }) {
    const { theme } = useTheme();

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

    if (!mounted) {
        return <div className="h-10 w-[144px] sm:h-11" />;
    }

    if (showAnimated) {
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

    const logoUrl = theme === "dark" ? darkLogo : lightLogo;

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
                    ? "bg-[var(--color-primary-400)]/12 text-[var(--color-primary-400)] shadow-sm"
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
                    ? "border-[var(--color-primary-400)]/20 bg-[var(--color-primary-400)]/12 text-[var(--color-primary-400)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]",
                className,
            ].join(" ")}
        >
            {children}
        </Link>
    );
}

export function NavBar() {
    const { t } = useTranslation();
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAuth();
    const [playTrigger, setPlayTrigger] = useState(0);
    const unreadCount = useNotificationsStore((s) => s.unreadCount);
    const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const initialLoadRef = useRef(false);
    useEffect(() => {
        if (!isAuthenticated || initialLoadRef.current) return;
        initialLoadRef.current = true;
        void getUnreadCount().then(setUnreadCount).catch(() => {});
    }, [isAuthenticated, setUnreadCount]);

    useEffect(() => {
        if (!notifOpen) return;
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [notifOpen]);

    const handleHomeClick = () => {
        setPlayTrigger((prev) => prev + 1);
    };

    const navLinks = useMemo(
        () => [
            { href: "/", label: t("tabs.home"), icon: <Home className="h-5 w-5 md:h-4 md:w-4" /> },
            { href: "/explore", label: t("tabs.explore"), icon: <Compass className="h-5 w-5 md:h-4 md:w-4" /> },
        ],
        [t]
    );

    return (
        <>
            {/* Desktop Top Nav */}
            <header className="hidden md:block sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
                <div className="mx-auto max-w-7xl">
                    <div className="relative rounded-[24px] border border-[var(--color-border)] bg-[var(--color-page-bg-from)] shadow-[0_12px_36px_-18px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-colors dark:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary-400)]/30 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--color-primary-400)]/5 via-transparent to-[var(--color-tertiary-500)]/5" />

                        <div className="relative flex h-16 items-center justify-between gap-3 px-3 sm:h-[72px] sm:px-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <Link
                                    href="/"
                                    className="flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)]/30"
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
                                {/* <IconAction
                                    href="/explore"
                                    label={t("tabs.explore")}
                                    active={isRouteActive(pathname, "/explore")}
                                >
                                    <Search className="h-4.5 w-4.5" />
                                </IconAction> */}

                                <div className="hidden flex! flex-row gap-1 sm:block">
                                    <ThemeToggle />
                                    <LanguageToggle/>
                                </div>

                                <div className="hidden sm:block h-6 w-px bg-[var(--color-border)]" />

                                {isLoading ? (
                                    <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--color-bg-input)]" />
                                ) : isAuthenticated ? (
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <IconAction
                                            href="/chat"
                                            label={t("tabs.chat")}
                                            active={isRouteActive(pathname, "/chat")}
                                            className="hidden md:flex"
                                        >
                                            <MessageCircle className="h-4.5 w-4.5" />
                                        </IconAction>

                                        <IconAction
                                            href="/shortlisted"
                                            label={t("tabs.saved")}
                                            active={isRouteActive(pathname, "/shortlisted")}
                                            className="hidden sm:flex"
                                        >
                                            <Heart className="h-4.5 w-4.5" />
                                        </IconAction>

                                        <div ref={notifRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setNotifOpen((v) => !v)}
                                                aria-label={t("headers.notifications")}
                                                className={[
                                                    "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
                                                    notifOpen
                                                        ? "border-[var(--color-primary-400)]/20 bg-[var(--color-primary-400)]/12 text-[var(--color-primary-400)]"
                                                        : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]",
                                                ].join(" ")}
                                            >
                                                <Bell className="h-4.5 w-4.5" />
                                                {unreadCount > 0 ? (
                                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                                        {unreadCount > 99 ? "99+" : unreadCount}
                                                    </span>
                                                ) : null}
                                            </button>

                                            {notifOpen ? (
                                                <div className="absolute right-0 top-full z-60 mt-2 w-[400px] overflow-hidden rounded-2xl border border-border bg-bg-card shadow-xl">
                                                    <div className="max-h-[480px]">
                                                        <NotificationsPanel onClose={() => setNotifOpen(false)} />
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="hidden sm:block h-6 w-px bg-[var(--color-border)]" />

                                        <Link
                                            href="/profile"
                                            aria-current={isRouteActive(pathname, "/profile") ? "page" : undefined}
                                            className={[
                                                "flex h-10 items-center gap-2 rounded-full border px-1 pr-3 transition-all duration-200",
                                                isRouteActive(pathname, "/profile")
                                                    ? "border-[var(--color-primary-400)]/20 bg-[var(--color-primary-400)]/10 text-[var(--color-primary-400)]"
                                                    : "border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-400)]/20 hover:text-[var(--color-text-primary)]",
                                            ].join(" ")}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-card)]">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="hidden sm:inline text-sm font-medium">{t("tabs.profile")}</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="ml-1 rounded-full bg-[var(--color-primary-400)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                                    >
                                        {t("common.login")}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/90 px-4 pb-safe pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <div className="flex h-14 items-center justify-around">
                    {[
                        { href: "/explore", icon: <Building2 className="h-6 w-6" />, id: "explore" },
                        { href: "/", icon: <Home className="h-6 w-6" />, onClick: handleHomeClick, id: "home" },
                        ...(isAuthenticated ? [
                            { href: "/shortlisted", icon: <Heart className="h-6 w-6" />, id: "shortlisted" },
                            { href: "/chat", icon: <MessageCircle className="h-6 w-6" />, id: "chat" },
                            { href: "/profile", icon: <User className="h-6 w-6" />, id: "profile" }
                        ] : [
                            { href: "/login", icon: <User className="h-6 w-6" />, id: "login" }
                        ])
                    ].map((item) => {
                        const active = isRouteActive(pathname, item.href);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={item.onClick}
                                className="relative flex h-12 w-12 items-center justify-center"
                            >
                                {active && (
                                    <motion.div
                                        layoutId="mobile-nav-pill"
                                        className="absolute inset-0 rounded-full bg-[var(--color-primary-400)]/15"
                                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                    />
                                )}
                                <div className={`relative z-10 transition-colors duration-200 ${active ? "text-[var(--color-primary-400)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}>
                                    {item.icon}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}