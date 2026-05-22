"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { profileService } from "@/services/apiService/profile";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { LoginModal } from "@/components/auth/LoginModal";

interface ListPropertyButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ListPropertyButton({ className, children }: ListPropertyButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  // We use query for bootstrap to get landlord_verified status
  const bootstrapQuery = useQuery({
    queryKey: ["profile", "bootstrap"],
    queryFn: () => profileService.getBootstrap(),
    enabled: isAuthenticated,
  });

  const handlePress = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    const profile = bootstrapQuery.data?.profile;
    if (!profile) return;

    if (profile.landlord_verified) {
      router.push("/add-property");
    } else {
      router.push("/profile/landlord-verify");
    }
  };

  const isLoading = isAuthenticated && (bootstrapQuery.isLoading || checking);

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
