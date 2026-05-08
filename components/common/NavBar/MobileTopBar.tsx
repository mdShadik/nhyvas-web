"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { darkLogo, lightLogo } from "@/assets";

export function MobileTopBar() {
  const { theme } = useTheme();
  const logoUrl = theme === "light" ? darkLogo : lightLogo;

  return (
    <div className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-bg-card/90 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex items-center">
        <Image
          src={logoUrl}
          alt="Nhyvas"
          priority
          width={100}
          height={32}
          className="h-8 w-auto object-contain"
        />
      </Link>
      <Link
        href="/notifications"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
      </Link>
    </div>
  );
}
