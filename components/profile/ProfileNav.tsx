"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/profile") return pathname === "/profile";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProfileNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/profile", label: t("profile.menu.edit_profile"), icon: <User className="h-4 w-4" /> },
    { href: "/profile/saved", label: t("profile.menu.shortlisted"), icon: <Heart className="h-4 w-4" /> },
    { href: "/profile/my-ads", label: t("profile.menu.my_ads"), icon: <Building2 className="h-4 w-4" /> },
    { href: "/profile/leads", label: t("profile.menu.my_leads"), icon: <Users className="h-4 w-4" /> },
    { href: "/profile/recently-viewed", label: t("profile.menu.recently_viewed"), icon: <Clock className="h-4 w-4" /> },
    { href: "/addresses", label: t("navigation.addresses"), icon: <MapPin className="h-4 w-4" /> },
    { href: "/profile/help-center", label: t("help_center.title"), icon: <HelpCircle className="h-4 w-4" /> },
    { href: "/profile/support-chats", label: t("navigation.support_chats"), icon: <MessageCircle className="h-4 w-4" /> },
    { href: "/profile/terms-and-conditions", label: t("profile.menu.terms"), icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-400/12 text-primary-400"
                : "text-text-secondary hover:bg-bg-input hover:text-text-primary"
            )}
          >
            <span className={cn("opacity-90", active ? "text-primary-400" : "text-text-tertiary")}>
              {item.icon}
            </span>
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}

      <div className="my-3 h-px bg-border" />

      <Link
        href="/logout"
        className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-input hover:text-text-primary"
      >
        <LogOut className="h-4 w-4 text-text-tertiary" />
        <span>{t("profile.logout.log_out")}</span>
      </Link>
      <Link
        href="/profile/delete-account"
        className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-red-500/90 transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
        <span>{t("profile.delete.delete_account")}</span>
      </Link>
    </nav>
  );
}
