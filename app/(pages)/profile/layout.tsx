"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/profile/RequireAuth";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ProfileLayoutProps = {
  children: React.ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isRoot = pathname === "/profile";

  const isSupportTicket = pathname.startsWith("/profile/support-ticket/");
  const isPayment = pathname.includes("/payment");
  const isLandlordVerify = pathname.includes("/landlord-verify");
  const isPaymentHistory = pathname.includes("/payment-history");

  React.useEffect(() => {
    if (isRoot || isSupportTicket || isPayment || isLandlordVerify || isPaymentHistory) {
      document.body.style.overflow = "";
      return;
    }
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRoot, isSupportTicket, isLandlordVerify, isPaymentHistory]);

  return (
    <RequireAuth>
      <div className={cn("min-h-dvh")}>
        <div className="mx-auto max-w-6xl sm:px-6 sm:pt-8">
          <header className="mb-4 sm:mb-6 hidden">
            <h1 className="text-xl font-extrabold text-text-primary sm:text-3xl">
              {t("tabs.profile")}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t("profile.preferences.subtitle")}
            </p>
          </header>

          {/* Desktop layout */}
          <div className="hidden gap-6 md:grid md:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="sticky top-8 h-fit max-h-[calc(100vh-64px)] overflow-y-auto border border-border bg-bg-page p-3 shadow-sm scrollbar-hide">
              <ProfileNav />
            </aside>

            <main className="min-w-0 border border-border bg-bg-page p-4 shadow-sm sm:p-6">
              {children}
            </main>
          </div>

          {/* Mobile layout — menu list on root, slide-over on sub-routes */}
          <div className="md:hidden">
            {isRoot ? (
              <div className=" sm:border border-border p-4 shadow-xl">
                <ProfileNav />
              </div>
            ) : null}

            <AnimatePresence>
              {!isRoot ? (
                <motion.section
                  key="mobile-profile-panel"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                  className={cn(
                    "fixed inset-0 z-50 bg-bg-page",
                    !(isSupportTicket || isPayment || isLandlordVerify || isPaymentHistory) && "overflow-y-auto"
                  )}
                  style={{ willChange: "transform" }}
                >
                  <div className={cn("flex h-full flex-col")}>
                    {!isSupportTicket && !isPayment && !isLandlordVerify && !isPaymentHistory && (
                      <div className="sticky top-0 z-10 border-b border-border bg-bg-page/40 backdrop-blur">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Link
                            href="/profile"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition active:scale-[0.98]"
                            aria-label={t("common.back", "Back")}
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </Link>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text-primary">
                              {t("tabs.profile")}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {t("profile.preferences.subtitle")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={cn("flex-1 min-w-0", (isSupportTicket || isPayment || isLandlordVerify || isPaymentHistory) && "overflow-hidden")}>
                      {isSupportTicket || isPayment || isLandlordVerify || isPaymentHistory ? (
                        <div className="h-full overflow-y-auto">{children}</div>
                      ) : (
                        <div className="min-w-0 px-4 pb-24 pt-4">
                          <div className="min-w-0 shadow-sm">
                            {children}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
  }