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
    amenityNames: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  categoriesData: { code: string; name: string }[];
  amenitiesData: { id: string; name: string }[];
  selectedCategory: { code: string; name: string } | null;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
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

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Camera className="h-4 w-4 text-text-tertiary" />
          {t("profile.form.avatar")}
        </div>
        <Input
          value={form.avatarUrl}
          onChange={(e) =>
            setForm((p) => ({ ...p, avatarUrl: e.target.value }))
          }
          placeholder="https://..."
        />
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
            const selected = form.amenityNames.includes(amenity.name);

            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    amenityNames: selected
                      ? p.amenityNames.filter((a) => a !== amenity.name)
                      : [...p.amenityNames, amenity.name],
                  }))
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  selected
                    ? "border-primary-400/40 bg-primary-400/12 text-primary-400"
                    : "border-border bg-bg-input text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-800"
                )}
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
    amenityNames: [] as string[],
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
      amenityNames: preferences?.preferred_amenities ?? [],
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
        preferred_amenities: form.amenityNames,
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
    return <div className="h-56 animate-pulse rounded-[24px] bg-bg-input" />;
  }

  if (!profile) {
    return (
      <div className="rounded-[24px] border border-border bg-bg-card p-5">
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
      {/* ─── MOBILE: messenger-style header ─── */}
      <section className="overflow-hidden rounded-[28px] bg-bg-page sm:hidden">
        <div className="bg-linear-to-br from-primary-500/10 dark:via-primary-900/20 to-tertiary-50 dark:to-tertiary-900/50 px-4 pb-5 pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-bg-input ring-4 ring-bg-card shadow-sm">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-text-tertiary">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-3 text-xl font-extrabold text-text-primary">
              {name}
            </div>

            <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-bg-input px-3 py-1.5 text-sm text-text-secondary">
              <Mail className="h-4 w-4 shrink-0 text-text-tertiary" />
              <span className="truncate">
                {email || t("profile.no_email")}
              </span>
            </div>

            <Button
              onClick={openEdit}
              className="mt-4 h-9 rounded-full px-4 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
              size="sm"
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {t("profile.menu.edit_profile")}
            </Button>
          </div>
        </div>

        <div className="space-y-3 pb-3">
          <div className="rounded-[22px] rounded-t-none border border-t-0 border-border bg-bg-page! p-2">
            <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
              {t("profile.preferences.title")}
            </div>

            <div className="overflow-hidden rounded-[18px] bg-bg-page">
              <div className="flex items-start gap-3 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <Shapes className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-text-tertiary">
                    {t("profile.preferences.preferred_category")}
                  </div>
                  <div className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                    {preferences?.category_code ?? "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-border px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-500/10 text-tertiary-600 dark:text-tertiary-400">
                  <CircleDollarSign className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-text-tertiary">
                    {t("profile.preferences.min_price")} /{" "}
                    {t("profile.preferences.max_price")}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-text-primary">
                    {preferences?.min_price ?? "—"} -{" "}
                    {preferences?.max_price ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-border bg-bg-input p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Sparkles className="h-4 w-4 text-text-tertiary" />
              {t("explore.amenities")}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {preferredAmenities.length ? (
                preferredAmenities.slice(0, 12).map((amenityName) => (
                  <span
                    key={amenityName}
                    className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary"
                  >
                    {tAmenity(amenityName)}
                  </span>
                ))
              ) : (
                <div className="text-sm text-text-tertiary">
                  {t("property.no_amenities")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DESKTOP: original style ─── */}
      <section className="hidden rounded-[28px] border border-border bg-bg-card p-4 sm:block sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-border bg-bg-input">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-text-tertiary">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold text-text-primary">
                {name}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <Mail className="h-4 w-4 shrink-0 text-text-tertiary" />
                <span className="truncate">
                  {email || t("profile.no_email")}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={openEdit}
            className="shrink-0 rounded-full"
            size="sm"
          >
            <PencilLine className="mr-2 h-4 w-4" />
            {t("profile.menu.edit_profile")}
          </Button>
        </div>
      </section>

      <section className="hidden gap-4 sm:grid sm:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Shapes className="h-4 w-4 text-text-tertiary" />
            {t("profile.preferences.title")}
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-bg-input px-3 py-3">
              <div className="text-xs text-text-tertiary">
                {t("profile.preferences.preferred_category")}
              </div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {preferences?.category_code ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-bg-input px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <CircleDollarSign className="h-4 w-4" />
                {t("profile.preferences.min_price")} /{" "}
                {t("profile.preferences.max_price")}
              </div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {preferences?.min_price ?? "—"} -{" "}
                {preferences?.max_price ?? "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-text-tertiary" />
            {t("explore.amenities")}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {preferredAmenities.length ? (
              preferredAmenities.slice(0, 12).map((amenityName) => (
                <span
                  key={amenityName}
                  className="rounded-full border border-border bg-bg-input px-3 py-1.5 text-xs font-medium text-text-secondary"
                >
                  {tAmenity(amenityName)}
                </span>
              ))
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
              className="h-11 flex-1 rounded-2xl text-sm font-semibold"
              onClick={handleClose}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="h-11 flex-1 rounded-2xl text-sm font-semibold"
              onClick={() => saveMutation.mutate()}
              disabled={busy}
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
      <div className="hidden sm:contents">
        <Dialog
          open={editOpen}
          title={t("profile.menu.edit_profile")}
          description={t("profile.preferences.subtitle")}
          confirmLabel={t("profile.preferences.save")}
          cancelLabel={t("common.cancel")}
          busy={busy}
          onClose={handleClose}
          onConfirm={() => saveMutation.mutate()}
        >
          <EditProfileForm {...sharedFormProps} />
        </Dialog>
      </div>
    </div>
  );
}