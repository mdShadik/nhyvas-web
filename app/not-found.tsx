"use client";

import Link from "next/link";
import { Home, Compass, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-16 text-center">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-tertiary-400/10 blur-3xl dark:bg-tertiary-500/10" />
      </div>

      <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-[32px] border border-border bg-bg-card shadow-2xl">
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <MapPin className="h-4 w-4" />
        </div>
        <span className="bg-linear-to-br from-primary-500 to-tertiary-500 bg-clip-text text-6xl font-black text-transparent">
          404
        </span>
      </div>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
        {t("common.page_not_found", "Page not found")}
      </h1>
      
      <p className="mb-10 max-w-md text-base text-text-secondary leading-relaxed">
        {t("common.page_not_found_desc", "We couldn't find the page you were looking for. It might have been moved or deleted.")}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button asChild className="h-12 rounded-2xl bg-linear-to-r from-primary-500 to-tertiary-500 px-8 text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02]">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("common.back_to_home", "Back to Home")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-2xl border-border bg-bg-card px-8 text-text-primary transition-all hover:border-primary-500/30 hover:bg-primary-50/50 dark:hover:bg-primary-900/20">
          <Link href="/explore">
            <Compass className="mr-2 h-4 w-4" />
            {t("tabs.explore", "Explore")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
