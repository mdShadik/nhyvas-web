"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Loader2, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";

import { profileService, AppProfile, UserPreferences } from "@/services/apiService/profile";
import { uploadToR2 } from "@/services/apiService/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { RequireAuth } from "@/components/profile/RequireAuth";
import { useAuth } from "@/context/AuthContext";

type FormData = {
  legalName: string;
  phoneNumber: string;
};

export default function LandlordVerifyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [houseImageFile, setHouseImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { profile, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (profile?.landlord_verified) {
      router.replace("/add-property");
    }
  }, [profile, router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      legalName: "",
      phoneNumber: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ variant: "error", message: "Image must be smaller than 5MB" });
        return;
      }
      setHouseImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!houseImageFile) {
      showToast({ variant: "error", message: "Please upload a property photo" });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload house image to R2
      const { publicUrl } = await uploadToR2({
        file: houseImageFile,
        folder: "landlord-verification",
      });

      // 2. Submit verification details
      await profileService.submitLandlordVerification({
        legalName: data.legalName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        houseImageUrl: publicUrl,
      });

      showToast({
        variant: "success",
        message: t("landlord_verify.success_message"),
      });

      // 3. Update cache immediately
      queryClient.setQueryData<{
        profile: AppProfile | null;
        preferences: UserPreferences | null;
      }>(["profile", "bootstrap"], (old) => {
        if (!old || !old.profile) return old;
        return {
          ...old,
          profile: {
            ...old.profile,
            landlord_verified: true,
          },
        };
      });

      // 4. Invalidate profile query to ensure it's fresh
      void queryClient.invalidateQueries({ queryKey: ["profile", "bootstrap"] });
      
      // 5. Redirect to property listing page
      router.replace("/add-property");
    } catch (error: any) {
      showToast({
        variant: "error",
        message: error.message || t("landlord_verify.error_message"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-bg-page pb-20 md:px-4 md:pt-8">
        <div className="mx-auto max-w-xl">
          {/* Mobile-only header */}
          <div className="sticky top-0 z-10 border-b border-border bg-bg-page/40 backdrop-blur md:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Link
                href="/profile"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition active:scale-[0.98]"
                aria-label={t("common.back", "Back")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  {t("landlord_verify.title")}
                </div>
                <div className="text-[10px] leading-tight text-text-tertiary">
                  {t("landlord_verify.subtitle")}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="mb-6 hidden items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition md:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </button>

          <div className="overflow-hidden md:rounded-[32px] md:border md:border-border md:bg-bg-card md:shadow-xl">
            <div className="border-b border-border bg-primary-50/50 dark:bg-primary-900/10 px-8 py-8 hidden md:block">
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                {t("landlord_verify.title")}
              </h1>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {t("landlord_verify.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Legal Name */}
                <div className="space-y-2">
                  <Label htmlFor="legalName" className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t("landlord_verify.legal_name")} *
                  </Label>
                  <Controller
                    name="legalName"
                    control={control}
                    rules={{ required: "Legal name is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="legalName"
                        placeholder={t("landlord_verify.legal_name_placeholder")}
                        className={cn(
                          "h-12 rounded-2xl",
                          errors.legalName ? "border-red-500" : ""
                        )}
                      />
                    )}
                  />
                  {errors.legalName && (
                    <p className="ml-1 text-xs font-medium text-red-500">{errors.legalName.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t("landlord_verify.phone_number")} *
                  </Label>
                  <Controller
                    name="phoneNumber"
                    control={control}
                    rules={{ 
                      required: "Phone number is required",
                      pattern: {
                        value: /^9\d{9}$/,
                        message: "Enter a valid 10-digit mobile number"
                      }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="phoneNumber"
                        inputMode="tel"
                        placeholder={t("landlord_verify.phone_number_placeholder")}
                        className={cn(
                          "h-12 rounded-2xl",
                          errors.phoneNumber ? "border-red-500" : ""
                        )}
                      />
                    )}
                  />
                  {errors.phoneNumber && (
                    <p className="ml-1 text-xs font-medium text-red-500">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* House Image Upload */}
                <div className="space-y-2">
                  <Label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t("landlord_verify.house_image")} *
                  </Label>
                  <div className="flex flex-col gap-4">
                    <label
                      htmlFor="house-image-upload"
                      className={cn(
                        "group relative flex h-52 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed transition-all",
                        previewUrl 
                          ? "border-primary-500/30 bg-primary-500/5" 
                          : "border-border bg-bg-input hover:border-primary-500/50 hover:bg-primary-500/5"
                      )}
                    >
                      {previewUrl ? (
                        <div className="relative h-full w-full p-3">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-cover rounded-[20px]"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[20px]">
                             <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                               <Camera className="h-5 w-5 text-white" />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                            <UploadCloud className="h-7 w-7" />
                          </div>
                          <div className="text-center px-4">
                            <span className="block text-sm font-bold text-text-primary">{t("landlord_verify.upload_image")}</span>
                            <span className="mt-1 block text-xs text-text-tertiary">{t("landlord_verify.house_image_hint")}</span>
                          </div>
                        </>
                      )}
                      <input
                        id="house-image-upload"
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={submitting}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 pb-12 md:pb-0">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-2xl bg-linear-to-r from-primary-500 via-primary-600 to-tertiary-500 text-lg font-black text-white shadow-xl shadow-primary-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      {t("landlord_verify.verifying")}
                    </>
                  ) : (
                    t("landlord_verify.continue")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
