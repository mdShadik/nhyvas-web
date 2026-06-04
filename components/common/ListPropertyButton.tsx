"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAddPropertyStore } from "@/stores/addPropertyStore";

interface ListPropertyButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ListPropertyButton({ className, children }: ListPropertyButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, profile, isLoading: authLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const { resetStore } = useAddPropertyStore();

  const handlePress = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    if (!profile) return;

    if (profile.landlord_verified) {
      resetStore();
      router.push("/add-property");
    } else {
      router.push("/profile/landlord-verify");
    }
  };

  const isLoading = isAuthenticated && authLoading;

  return (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={handlePress}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children || (
            <>
              <Plus className="h-4 w-4" />
              <span>{t("explore.list_property")}</span>
            </>
          )
        )}
      </button>

      <LoginModal 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        nextUrl="/add-property" 
      />
    </>
  );
}
