"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Heart,
  Building2,
  Users,
  Clock,
  MapPin,
  HelpCircle,
  MessageCircle,
  FileText,
  LogOut,
  Trash2,
  User,
  Download,
  ChevronRight,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback, Fragment } from "react";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { PWAInstallPrompt } from "../ui/pwa-install-prompt";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  group: "main" | "support" | "legal";
};

function isActive(pathname: string, href: string) {
  if (href === "/profile/overview")
    return pathname === "/profile" || pathname === "/profile/overview";
  if (href === "/profile") return pathname === "/profile";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProfileNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [openInstall, setOpenInstall] = useState(false);
  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = useCallback(() => {
    setOpenLogout(false);
    router.push("/logout");
  }, [router]);

  const items: NavItem[] = [
    {
      href: "/profile/overview",
      label: t("profile.menu.edit_profile"),
      icon: <User className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/saved",
      label: t("profile.menu.shortlisted"),
      icon: <Heart className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/my-ads",
      label: t("profile.menu.my_ads"),
      icon: <Building2 className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/leads",
      label: t("profile.menu.my_leads"),
      icon: <Users className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/recently-viewed",
      label: t("profile.menu.recently_viewed"),
      icon: <Clock className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/payment-history",
      label: t("profile.menu.payment_history"),
      icon: <Clock className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/addresses",
      label: t("navigation.addresses"),
      icon: <MapPin className="h-[18px] w-[18px]" />,
      group: "main",
    },
    {
      href: "/profile/help-center",
      label: t("help_center.title"),
      icon: <HelpCircle className="h-[18px] w-[18px]" />,
      group: "support",
    },
    {
      href: "/profile/support-chats",
      label: t("navigation.support_chats"),
      icon: <MessageCircle className="h-[18px] w-[18px]" />,
      group: "support",
    },
    {
      href: "/profile/terms-and-conditions",
      label: t("profile.menu.terms"),
      icon: <FileText className="h-[18px] w-[18px]" />,
      group: "legal",
    },
  ];

  const groups = {
    main: items.filter((i) => i.group === "main"),
    support: items.filter((i) => i.group === "support"),
    legal: items.filter((i) => i.group === "legal"),
  };

  const groupLabels: Record<string, string> = {
    main: t("profile.menu.group_account", "Account"),
    support: t("profile.menu.group_support", "Support"),
    legal: t("profile.menu.group_legal", "Legal"),
  };

  return (
    <>
      {/* ===================== DESKTOP NAV ===================== */}
      <nav className="hidden md:flex flex-col gap-1.5 w-full" aria-label="Profile navigation">
        {(["main", "support", "legal"] as const).map((groupKey, gi) => (
          <Fragment key={groupKey}>
            {gi > 0 && <div className="my-1.5" />}

            {/* Group Label */}
            <span className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary/70 select-none">
              {groupLabels[groupKey]}
            </span>

            {/* Items */}
            {groups[groupKey].map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary-500/10 text-primary-500 dark:bg-primary-400/12 dark:text-primary-400 shadow-sm shadow-primary-500/5"
                      : "text-text-secondary hover:bg-secondary-100 hover:text-text-primary dark:hover:bg-secondary-800/60"
                  )}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary-500 dark:bg-primary-400" />
                  )}

                  {/* Icon container */}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                      active
                        ? "bg-primary-500/15 text-primary-500 dark:bg-primary-400/15 dark:text-primary-400"
                        : "bg-secondary-100 text-text-tertiary group-hover:bg-secondary-200 group-hover:text-text-secondary dark:bg-secondary-800 dark:group-hover:bg-secondary-700"
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 truncate">{item.label}</span>

                  {/* Badge */}
                  {item.badge && (
                    <span className="ml-auto shrink-0 rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}

                  {/* Chevron on hover */}
                  <ChevronRight
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0 transition-all duration-200",
                      active
                        ? "text-primary-500/50 dark:text-primary-400/50"
                        : "text-transparent group-hover:text-text-tertiary"
                    )}
                  />
                </Link>
              );
            })}
          </Fragment>
        ))}

        {/* Divider */}
        <div className="my-2 h-px bg-border" />

        {/* Logout */}
        <button
          onClick={() => setOpenLogout(true)}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-secondary-100 hover:text-text-primary dark:hover:bg-secondary-800/60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-text-tertiary transition-colors group-hover:bg-secondary-200 dark:bg-secondary-800 dark:group-hover:bg-secondary-700">
            <LogOut className="h-[18px] w-[18px]" />
          </span>
          <span>{t("profile.logout.log_out")}</span>
        </button>

        {/* Delete Account */}
        <Link
          href="/profile/delete-account"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500/80 transition-all duration-200 hover:bg-red-500/8 hover:text-red-500"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/8 text-red-500/60 transition-colors group-hover:bg-red-500/15 group-hover:text-red-500">
            <Trash2 className="h-[18px] w-[18px]" />
          </span>
          <span>{t("profile.delete.delete_account")}</span>
        </Link>
      </nav>

      {/* ===================== MOBILE NAV ===================== */}
      <nav className="flex md:hidden flex-col w-full" aria-label="Profile navigation mobile">
        {/* Install App CTA */}
        <button
          onClick={() => setOpenInstall(true)}
          className="group mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-tertiary-500 p-3.5 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-transform duration-150"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Download className="h-5 w-5 text-white" />
          </span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-white">
              {t("pwa.install", "Install App")}
            </span>
            <span className="text-[11px] text-white/70 font-medium">
              {t("pwa.install_subtitle", "Faster & offline access")}
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-white/50" />
        </button>

        {(["main", "support", "legal"] as const).map((groupKey, gi) => (
          <Fragment key={groupKey}>
            {/* Group Label */}
            <div className="px-6 pt-4 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary/60 select-none">
                {groupLabels[groupKey]}
              </span>
            </div>

            {/* Card container for group */}
            <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-bg-card dark:bg-secondary-800/40">
              {groups[groupKey].map((item, i) => {
                const active = isActive(pathname, item.href);
                const isLast = i === groups[groupKey].length - 1;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-secondary-100 dark:active:bg-secondary-800",
                      active
                        ? "bg-primary-500/6 dark:bg-primary-400/8"
                        : "",
                      !isLast && "border-b border-border/60"
                    )}
                  >
                    {/* Icon */}
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-primary-500/12 text-primary-500 dark:bg-primary-400/15 dark:text-primary-400"
                          : "bg-secondary-100 text-text-tertiary dark:bg-secondary-700/60"
                      )}
                    >
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span
                      className={cn(
                        "min-w-0 truncate text-[14px] font-medium",
                        active
                          ? "text-primary-500 dark:text-primary-400"
                          : "text-text-primary"
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="ml-auto shrink-0 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}

                    {/* Chevron */}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.badge ? "" : "ml-auto",
                        active
                          ? "text-primary-500/40 dark:text-primary-400/40"
                          : "text-text-tertiary/40"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </Fragment>
        ))}

        {/* Danger Zone */}
        <div className="px-6 pt-4 pb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary/60 select-none">
            {t("profile.menu.group_danger", "Account Actions")}
          </span>
        </div>

        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-bg-card dark:bg-secondary-800/40">
          {/* Logout */}
          <button
            onClick={() => setOpenLogout(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-secondary-100 dark:active:bg-secondary-800 border-b border-border/60"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-text-tertiary dark:bg-secondary-700/60">
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[14px] font-medium text-text-primary">
              {t("profile.logout.log_out")}
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-text-tertiary/40" />
          </button>

          {/* Delete */}
          <Link
            href="/profile/delete-account"
            className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-red-500/8"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/8 text-red-500/70">
              <Trash2 className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[14px] font-medium text-red-500/80">
              {t("profile.delete.delete_account")}
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-red-500/30" />
          </Link>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-8" />
      </nav>

      {/* ===================== DIALOGS ===================== */}
      <PWAInstallPrompt
        openTrigger={openInstall}
        onCloseTrigger={() => setOpenInstall(false)}
      />

      <Dialog
        open={openLogout}
        title={t("profile.logout.confirm_title", "Log Out?")}
        description={t(
          "profile.logout.confirm_description",
          "Are you sure you want to log out of your account?"
        )}
        confirmLabel={t("profile.logout.log_out", "Log Out")}
        cancelLabel={t("common.cancel", "Cancel")}
        onClose={() => setOpenLogout(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}