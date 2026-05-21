"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CircleDollarSign,
  Mail,
  PencilLine,
  Shapes,
  Sparkles,
  UserRound,
} from "lucide-react";

import { profileService } from "@/services/apiService/profile";
import { exploreService } from "@/services/apiService/explore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { useToast } from "@/context/ToastContext";
import { tAmenity } from "@/i18n/masterData";
import { cn } from "@/lib/utils";

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/* ─── shared edit form (used in both sheet & dialog) ─── */
function EditProfileForm({
  form,
  setForm,
  categoriesData,
  amenitiesData,
  selectedCategory,
  t,
}: {
  form: {
    fullName: string;
    email: string;
    avatarUrl: string;
    minPrice: string;
    maxPrice: string;
    categoryCode: string;
    amenityIds: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  categoriesData: { code: string; name: string }[];
  amenitiesData: { id: string; name: string }[];
  selectedCategory: { code: string; name: string } | null;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5 flex flex-col gap-2 justify-center items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Camera className="h-4 w-4 text-text-tertiary" />
          {t("profile.form.avatar")}
        </div>
        <AvatarUpload
          currentAvatarUrl={form.avatarUrl}
          onAvatarChange={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
          className="items-start!"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-sm font-medium text-text-primary">
            {t("profile.form.full_name")}
          </div>
          <Input
            value={form.fullName}
            onChange={(e) =>
              setForm((p) => ({ ...p, fullName: e.target.value }))
            }
            placeholder={t("profile.form.full_name_placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-sm font-medium text-text-primary">
            {t("profile.form.email")}
          </div>
          <Input
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder={t("profile.form.email_placeholder")}
          />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <div className="text-sm font-medium text-text-primary">
            {t("profile.preferences.min_price")}
          </div>
          <Input
            value={form.minPrice}
            inputMode="numeric"
            onChange={(e) =>
              setForm((p) => ({ ...p, minPrice: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-sm font-medium text-text-primary">
            {t("profile.preferences.max_price")}
          </div>
          <Input
            value={form.maxPrice}
            inputMode="numeric"
            onChange={(e) =>
              setForm((p) => ({ ...p, maxPrice: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <div className="text-sm font-medium text-text-primary">
            {t("profile.preferences.preferred_category")}
          </div>
          <Input
            value={form.categoryCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, categoryCode: e.target.value }))
            }
            placeholder="e.g. apartment"
            list="profile-category-codes"
          />
          <datalist id="profile-category-codes">
            {categoriesData.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </datalist>
          {selectedCategory ? (
            <div className="text-xs text-text-tertiary">
              Selected: {selectedCategory.name}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <UserRound className="h-4 w-4 text-text-tertiary" />
          {t("explore.amenities")}
        </div>

        <div className="flex flex-wrap gap-2">
          {amenitiesData.slice(0, 24).map((amenity) => {
            const selected = form.amenityIds.includes(amenity.id);

            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    amenityIds: selected
                      ? p.amenityIds.filter((id) => id !== amenity.id)
                      : [...p.amenityIds, amenity.id],
                  }))
                }
                className={cn(
                  "border px-3 py-1.5 text-xs font-medium transition backdrop-blur-sm",
                  selected
                    ? "border-primary-400/40 bg-primary-400/20 text-primary-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    : "border-white/20 bg-white/5 text-text-secondary hover:bg-white/10"
                )}
                style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
              >
                {tAmenity(amenity.name)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─── */
export function ProfileOverview() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const bootstrapQuery = useQuery({
    queryKey: ["profile", "bootstrap"],
    queryFn: () => profileService.getBootstrap(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: () => exploreService.getHomeCategories(200),
  });

  const amenitiesQuery = useQuery({
    queryKey: ["explore", "amenities"],
    queryFn: () => exploreService.getAmenities(),
  });

  const profile = bootstrapQuery.data?.profile ?? null;
  const preferences = bootstrapQuery.data?.preferences ?? null;

  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    minPrice: "",
    maxPrice: "",
    categoryCode: "",
    amenityIds: [] as string[],
  });

  const selectedCategory = useMemo(() => {
    const code = form.categoryCode.trim();
    if (!code) return null;
    return (categoriesQuery.data ?? []).find((c) => c.code === code) ?? null;
  }, [categoriesQuery.data, form.categoryCode]);

  const openEdit = () => {
    if (!profile) return;

    setForm({
      fullName: profile.full_name ?? "",
      email: profile.email ?? "",
      avatarUrl: profile.avatar_url ?? "",
      minPrice:
        preferences?.min_price !== null && preferences?.min_price !== undefined
          ? String(preferences.min_price)
          : "",
      maxPrice:
        preferences?.max_price !== null && preferences?.max_price !== undefined
          ? String(preferences.max_price)
          : "",
      categoryCode: preferences?.category_code ?? "",
      amenityIds: preferences?.preferred_amenities ?? [],
    });

    setEditOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const minPrice = parseOptionalNumber(form.minPrice);
      const maxPrice = parseOptionalNumber(form.maxPrice);

      if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
        throw new Error("Price must be a valid number.");
      }

      if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        throw new Error("Min price must be less than max price.");
      }

      await profileService.completeOnboarding({
        fullName: form.fullName.trim() || "User",
        email: form.email.trim() || null,
        avatarUri: form.avatarUrl.trim() || null,
      });

      await profileService.updatePreferences({
        min_price: minPrice,
        max_price: maxPrice,
        category_code: form.categoryCode.trim() || null,
        preferred_amenities: form.amenityIds,
      });
    },
    onMutate: () => setBusy(true),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["profile", "bootstrap"],
      });
      showToast({
        variant: "success",
        message: t("profile.preferences.save"),
      });
      setEditOpen(false);
    },
    onError: (err: any) => {
      showToast({
        variant: "error",
        message: err?.message ?? t("auth.onboard_failed"),
      });
    },
    onSettled: () => setBusy(false),
  });

  const handleClose = () => {
    if (!busy) setEditOpen(false);
  };

  if (bootstrapQuery.isLoading) {
    return <div className="h-56 animate-pulse border border-white/20 bg-white/5 backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }} />;
  }

  if (!profile) {
    return (
      <div className="border border-white/20 bg-white/5 p-5 backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
        <div className="text-base font-bold text-text-primary">
          {t("auth.profile_load_failed")}
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {t("auth.server_session_failed")}
        </p>
      </div>
    );
  }

  const avatar = profile.avatar_url?.trim() || null;
  const name = profile.full_name?.trim() || "User";
  const email = profile.email?.trim() || "";
  const preferredAmenities = preferences?.preferred_amenities ?? [];

  const categoriesData = categoriesQuery.data ?? [];
  const amenitiesData = amenitiesQuery.data ?? [];

  const sharedFormProps = {
    form,
    setForm,
    categoriesData,
    amenitiesData,
    selectedCategory,
    t,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── MOBILE: marsian glassy header ─── */}
      <section className="sm:hidden" style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
        <div className="relative overflow-hidden border border-border bg-linear-to-br from-primary-500/10 via-primary-600/10 to-tertiary-500/10 p-4 pb-5 pt-6 backdrop-blur-2xl before:absolute before:inset-0 before:bg-linear-to-t before:from-white/5 before:to-transparent before:content-['']">
          <div className="relative flex flex-col items-center text-center">
            <div className="relative h-24 w-24 overflow-hidden border border-primary-400/40 bg-primary-500/10 shadow-[0_0_30px_rgba(99,102,241,0.3)]" style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}>
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-primary-400">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-3 text-xl font-extrabold text-text-primary">
              {name}
            </div>

            <div className="mt-2 inline-flex max-w-full items-center gap-2 border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-text-secondary backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <Mail className="h-4 w-4 shrink-0 text-primary-400" />
              <span className="truncate">
                {email || t("profile.no_email")}
              </span>
            </div>

            <Button
              onClick={openEdit}
              className="mt-4 h-9 border border-white/20 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-4 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
              size="sm"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {t("profile.menu.edit_profile")}
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative flex flex-col items-center justify-center gap-2 border border-white/20 bg-white/5 p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
              <div className="flex h-11 w-11 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                <Shapes className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-text-tertiary">
                  {t("profile.preferences.preferred_category")}
                </div>
                <div className="mt-0.5 text-sm font-bold text-text-primary">
                  {preferences?.category_code ?? "—"}
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center gap-2 border border-white/20 bg-white/5 p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
              <div className="flex h-11 w-11 items-center justify-center bg-tertiary-500/20 text-tertiary-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-text-tertiary">
                  {t("profile.preferences.min_price")} /{" "}
                  {t("profile.preferences.max_price")}
                </div>
                <div className="mt-0.5 text-sm font-bold text-text-primary">
                  {preferences?.min_price ?? "—"} -{" "}
                  {preferences?.max_price ?? "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-2 border border-white/20 bg-white/5 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
            <div className="flex h-11 w-11 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-medium text-text-tertiary">
              {t("explore.amenities")}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {preferredAmenities.length ? (
                preferredAmenities.slice(0, 12).map((amenityId) => {
                  const amenity = amenitiesData.find((a) => a.id === amenityId);
                  const name = amenity ? amenity.name : amenityId;
                  return (
                    <span
                      key={amenityId}
                      className="border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-sm backdrop-blur-sm"
                      style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
                    >
                      {tAmenity(name)}
                    </span>
                  );
                })
              ) : (
                <div className="text-sm text-text-tertiary">
                  {t("property.no_amenities")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DESKTOP: marsian glassy style ─── */}
      <section className="hidden border border-white/20 bg-white/5 p-4 backdrop-blur-2xl sm:block sm:p-5" style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-primary-400/40 bg-primary-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]" style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}>
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-primary-400">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold text-text-primary">
                {name}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <Mail className="h-4 w-4 shrink-0 text-primary-400" />
                <span className="truncate">
                  {email || t("profile.no_email")}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={openEdit}
            className="shrink-0 border border-white/20 bg-linear-to-r from-primary-500 to-tertiary-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
            size="sm"
            style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            {t("profile.menu.edit_profile")}
          </Button>
        </div>
      </section>

      <section className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative flex flex-col items-center justify-center gap-3 border border-white/20 bg-white/5 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
          <div className="flex h-12 w-12 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
            <Shapes className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-tertiary">
              {t("profile.preferences.preferred_category")}
            </div>
            <div className="mt-1 text-base font-bold text-text-primary">
              {preferences?.category_code ?? "—"}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center gap-3 border border-white/20 bg-white/5 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
          <div className="flex h-12 w-12 items-center justify-center bg-tertiary-500/20 text-tertiary-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-tertiary">
              {t("profile.preferences.min_price")} /{" "}
              {t("profile.preferences.max_price")}
            </div>
            <div className="mt-1 text-base font-bold text-text-primary">
              {preferences?.min_price ?? "—"} -{" "}
              {preferences?.max_price ?? "—"}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-3 border border-white/20 bg-white/5 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:col-span-2 lg:col-span-1" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
          <div className="flex h-12 w-12 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-xs font-medium text-text-tertiary">
            {t("explore.amenities")}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {preferredAmenities.length ? (
              preferredAmenities.slice(0, 12).map((amenityId) => {
                const amenity = amenitiesData.find((a) => a.id === amenityId);
                const name = amenity ? amenity.name : amenityId;
                return (
                  <span
                    key={amenityId}
                    className="border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-sm backdrop-blur-sm"
                    style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
                  >
                    {tAmenity(name)}
                  </span>
                );
              })
            ) : (
              <div className="text-sm text-text-tertiary">
                {t("property.no_amenities")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── MOBILE: bottom sheet for editing ─── */}
      <MobileBottomSheet
        open={editOpen}
        title={t("profile.menu.edit_profile")}
        description={t("profile.preferences.subtitle")}
        onClose={handleClose}
        className="sm:hidden"
      >
        <div className="space-y-5 pt-2">
          <EditProfileForm {...sharedFormProps} />

          <div className="flex gap-3 pb-[env(safe-area-inset-bottom)]">
            <Button
              variant="outline"
              className="h-11 flex-1 border border-white/20 bg-white/5 text-sm font-semibold backdrop-blur-sm"
              onClick={handleClose}
              disabled={busy}
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="h-11 flex-1 border border-white/20 bg-linear-to-r from-primary-500 to-tertiary-500 text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              onClick={() => saveMutation.mutate()}
              disabled={busy}
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t("profile.preferences.save")}
                </span>
              ) : (
                t("profile.preferences.save")
              )}
            </Button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* ─── DESKTOP: dialog for editing ─── */}
      <Dialog
        open={editOpen}
        title={t("profile.menu.edit_profile")}
        description={t("profile.preferences.subtitle")}
        confirmLabel={t("profile.preferences.save")}
        cancelLabel={t("common.cancel")}
        busy={busy}
        onClose={handleClose}
        onConfirm={() => saveMutation.mutate()}
        className="hidden sm:flex"
      >
        <EditProfileForm {...sharedFormProps} />
      </Dialog>
    </div>
  );
}