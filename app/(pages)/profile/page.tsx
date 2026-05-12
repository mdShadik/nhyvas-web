"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { profileService } from "@/services/apiService/profile";
import { exploreService } from "@/services/apiService/explore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { tAmenity } from "@/i18n/masterData";
import { cn } from "@/lib/utils";

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function ProfileOverviewPage() {
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

  const canEdit = Boolean(profile);

  const openEdit = () => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name ?? "",
      email: profile.email ?? "",
      avatarUrl: profile.avatar_url ?? "",
      minPrice: preferences?.min_price !== null && preferences?.min_price !== undefined ? String(preferences.min_price) : "",
      maxPrice: preferences?.max_price !== null && preferences?.max_price !== undefined ? String(preferences.max_price) : "",
      categoryCode: preferences?.category_code ?? "",
      amenityNames: preferences?.preferred_amenities ?? [],
    });
    setEditOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const minPrice = parseOptionalNumber(form.minPrice);
      const maxPrice = parseOptionalNumber(form.maxPrice);
      if (minPrice === (NaN as any) || maxPrice === (NaN as any)) {
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
      await queryClient.invalidateQueries({ queryKey: ["profile", "bootstrap"] });
      showToast({ variant: "success", message: t("common.saving") });
      setEditOpen(false);
    },
    onError: (err: any) => {
      showToast({ variant: "error", message: err?.message ?? t("auth.onboard_failed") });
    },
    onSettled: () => setBusy(false),
  });

  if (bootstrapQuery.isLoading) {
    return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-page-bg-from p-6">
        <div className="text-lg font-bold text-text-primary">{t("auth.profile_load_failed")}</div>
        <p className="mt-1 text-sm text-text-secondary">
          {t("auth.server_session_failed")}
        </p>
      </div>
    );
  }

  const avatar = profile.avatar_url?.trim() || null;
  const name = profile.full_name?.trim() || "User";
  const email = profile.email?.trim() || "";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border bg-bg-input">
            {avatar ? (
              <Image src={avatar} alt={name} fill className="object-cover" sizes="56px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-text-tertiary">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-extrabold text-text-primary">{name}</div>
            {email ? <div className="text-sm text-text-secondary">{email}</div> : <div className="text-sm text-text-tertiary">{t("profile.no_email")}</div>}
          </div>
        </div>

        <Button onClick={openEdit} disabled={!canEdit}>
          {t("profile.menu.edit_profile")}
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-page-bg-from p-4">
          <div className="text-sm font-semibold text-text-primary">{t("profile.preferences.title")}</div>
          <div className="mt-2 text-sm text-text-secondary">
            {t("profile.preferences.preferred_category")}:{" "}
            <span className="font-medium text-text-primary">
              {preferences?.category_code ?? "—"}
            </span>
          </div>
          <div className="mt-1 text-sm text-text-secondary">
            {t("profile.preferences.min_price")} - {t("profile.preferences.max_price")}:{" "}
            <span className="font-medium text-text-primary">
              {preferences?.min_price ?? "—"} - {preferences?.max_price ?? "—"}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-page-bg-from p-4">
          <div className="text-sm font-semibold text-text-primary">{t("explore.amenities")}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(preferences?.preferred_amenities ?? []).length ? (
              (preferences?.preferred_amenities ?? []).slice(0, 8).map((amenityName) => (
                <span
                  key={amenityName}
                  className="rounded-full bg-bg-input px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  {tAmenity(amenityName)}
                </span>
              ))
            ) : (
              <div className="text-sm text-text-tertiary">{t("property.no_amenities")}</div>
            )}
          </div>
        </div>
      </section>

      <Dialog
        open={editOpen}
        title={t("profile.menu.edit_profile")}
        description={t("profile.preferences.subtitle")}
        confirmLabel={t("profile.preferences.save")}
        cancelLabel={t("common.cancel")}
        busy={busy}
        onClose={() => (busy ? null : setEditOpen(false))}
        onConfirm={() => saveMutation.mutate()}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-text-primary">{t("profile.form.full_name")}</div>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder={t("profile.form.full_name_placeholder")}
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-text-primary">{t("profile.form.email")}</div>
              <Input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder={t("profile.form.email_placeholder")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-medium text-text-primary">{t("profile.form.avatar")}</div>
            <Input
              value={form.avatarUrl}
              onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-text-primary">{t("profile.preferences.min_price")}</div>
              <Input
                value={form.minPrice}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-text-primary">{t("profile.preferences.max_price")}</div>
              <Input
                value={form.maxPrice}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-text-primary">{t("profile.preferences.preferred_category")}</div>
              <Input
                value={form.categoryCode}
                onChange={(e) => setForm((p) => ({ ...p, categoryCode: e.target.value }))}
                placeholder="e.g. apartment"
                list="profile-category-codes"
              />
              <datalist id="profile-category-codes">
                {(categoriesQuery.data ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </datalist>
              {selectedCategory ? (
                <div className="text-xs text-text-tertiary">Selected: {selectedCategory.name}</div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-text-primary">{t("explore.amenities")}</div>
            <div className="flex flex-wrap gap-2">
              {(amenitiesQuery.data ?? []).slice(0, 24).map((amenity) => {
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
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      selected
                        ? "border-primary-400/40 bg-primary-400/12 text-primary-400"
                        : "border-border bg-bg-input text-text-secondary hover:bg-page-bg-from"
                    )}
                  >
                    {tAmenity(amenity.name)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
