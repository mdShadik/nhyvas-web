"use client";

import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
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
  Bell,
  BellOff,
} from "lucide-react";

import { profileService } from "@/services/apiService/profile";
import { exploreService } from "@/services/apiService/explore";
import { pushRegistrationService } from "@/services/pushRegistration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { useToast } from "@/context/ToastContext";
import { tAmenity } from "@/i18n/masterData";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

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
    categoryId: string;
    amenityIds: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  categoriesData: { id: string; name: string }[];
  amenitiesData: { id: string; name: string }[];
  selectedCategory: { id: string; name: string } | null;
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
          <Select
            value={form.categoryId}
            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
          >
            <option value="">Select a category</option>
            {categoriesData.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
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
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
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
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    minPrice: "",
    maxPrice: "",
    categoryId: "",
    amenityIds: [] as string[],
  });

  const categoriesData = categoriesQuery.data ?? [];
  const amenitiesData = amenitiesQuery.data ?? [];

  const selectedCategory = useMemo(() => {
    const id = form.categoryId.trim();
    if (!id) return null;
    return categoriesData.find((c) => c.id === id) ?? null;
  }, [categoriesData, form.categoryId]);

  const preferredCategoryName = useMemo(() => {
    if (!preferences?.category_id) return "—";
    return (
      categoriesData.find((c) => c.id === preferences.category_id)?.name ?? "—"
    );
  }, [categoriesData, preferences?.category_id]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    const profile = bootstrapQuery.data?.profile;
    if (!profile) return;

    // If opted in (or default) and permission is NOT denied, ensure we are registered.
    const pushOptIn = profile.push_opt_in ?? true;
    const canRegister = browserPermission === "default" || browserPermission === "granted";
    
    console.log("[ProfileOverview] Push check:", { pushOptIn, browserPermission, canRegister, supported: pushRegistrationService.isSupported() });
    
    if (pushOptIn && canRegister && pushRegistrationService.isSupported() && !hasRegisteredRef.current) {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log("[ProfileOverview] Attempting registration, VAPID key present:", !!vapidKey);
      if (vapidKey) {
        hasRegisteredRef.current = true; // Mark as attempted
        void pushRegistrationService.register(vapidKey).then((success) => {
          console.log("[ProfileOverview] Registration result:", success);
          if (success) setBrowserPermission("granted");
          else {
            setBrowserPermission(Notification.permission);
            hasRegisteredRef.current = false; // Allow retry if it failed (e.g. network error)
          }
        });
      }
    }
  }, [bootstrapQuery.data?.profile, browserPermission]);

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
      categoryId: preferences?.category_id ?? "",
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
        category_id: form.categoryId.trim() || null,
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

  const togglePushMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        if (!pushRegistrationService.isSupported()) {
          throw new Error("Push notifications are not supported on this browser.");
        }
        
        const currentStatus = Notification.permission;
        if (currentStatus === "denied") {
          throw new Error("Notifications are blocked by your browser. Please enable them in your browser settings to receive alerts.");
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error("Push configuration missing.");
        
        const success = await pushRegistrationService.register(vapidKey);
        if (!success) {
          throw new Error("Failed to register for push notifications. Please check your browser settings.");
        }
      }

      await profileService.togglePushOptIn(enabled);
    },
    onSuccess: (_, enabled) => {
      void queryClient.invalidateQueries({ queryKey: ["profile", "bootstrap"] });
      setBrowserPermission(Notification.permission);
      showToast({ 
        variant: "success", 
        message: enabled ? "Push notifications enabled." : "Push notifications disabled." 
      });
    },
    onError: (err: any) => {
      showToast({ variant: "error", message: err.message || "Failed to update push settings." });
    }
  });

  const handleClose = () => {
    if (!busy) setEditOpen(false);
  };

  if (bootstrapQuery.isLoading) {
    return (
      <div
        className="h-56 animate-pulse border border-white/20 bg-white/5 backdrop-blur-xl"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div
        className="border border-white/20 bg-white/5 p-5 backdrop-blur-xl"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
        }}
      >
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
  const pushEnabled = (profile.push_opt_in ?? true) && browserPermission === "granted";

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
      <section
        className="sm:hidden"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }}
      >
        <div className="relative overflow-hidden border border-border bg-linear-to-br from-primary-500/10 via-primary-600/10 to-tertiary-500/10 p-4 pb-5 pt-6 backdrop-blur-2xl before:absolute before:inset-0 before:bg-linear-to-t before:from-white/5 before:to-transparent before:content-['']">
          <div className="relative flex flex-col items-center text-center">
            <div
              className="relative h-24 w-24 overflow-hidden border border-primary-400/40 bg-primary-500/10 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              }}
            >
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

            <div
              className="mt-2 inline-flex max-w-full items-center gap-2 border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-text-secondary backdrop-blur-xl"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <Mail className="h-4 w-4 shrink-0 text-primary-400" />
              <span className="truncate">
                {email || t("profile.no_email")}
              </span>
            </div>

            <Button
              onClick={openEdit}
              className="mt-4 h-9 border border-white/20 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-4 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
              size="sm"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              }}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {t("profile.menu.edit_profile")}
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="relative flex flex-col items-center justify-center gap-2 border border-white/20 bg-white/5 p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                }}
              >
                <Shapes className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-text-tertiary">
                  {t("profile.preferences.preferred_category")}
                </div>
                <div className="mt-0.5 text-sm font-bold text-text-primary">
                  {preferredCategoryName}
                </div>
              </div>
            </div>

            <div
              className="relative flex flex-col items-center justify-center gap-2 border border-white/20 bg-white/5 p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center bg-tertiary-500/20 text-tertiary-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                }}
              >
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

          <div
            className="relative flex flex-col items-center gap-2 border border-white/20 bg-white/5 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <Bell className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Push Notifications</div>
            <div className="flex items-center gap-4">
               <span className="text-sm font-semibold text-text-primary">{pushEnabled ? "Enabled" : "Disabled"}</span>
               <button 
                 onClick={() => togglePushMutation.mutate(!pushEnabled)}
                 disabled={togglePushMutation.isPending}
                 className={cn(
                   "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   pushEnabled ? "bg-primary-500" : "bg-secondary-200 dark:bg-secondary-700"
                 )}
               >
                 <span className={cn(
                   "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                   pushEnabled ? "translate-x-5" : "translate-x-0"
                 )} />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DESKTOP: marsian glassy style ─── */}
      <section
        className="hidden border border-white/20 bg-white/5 p-4 backdrop-blur-2xl sm:block sm:p-5"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="relative h-16 w-16 shrink-0 overflow-hidden border border-primary-400/40 bg-primary-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              }}
            >
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 mr-4">
               <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Push Alerts</div>
                  <div className="text-xs font-semibold text-text-primary">{pushEnabled ? "Enabled" : "Disabled"}</div>
               </div>
               <button 
                 onClick={() => togglePushMutation.mutate(!pushEnabled)}
                 disabled={togglePushMutation.isPending}
                 className={cn(
                   "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   pushEnabled ? "bg-primary-500" : "bg-secondary-200 dark:bg-secondary-700"
                 )}
               >
                 <span className={cn(
                   "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                   pushEnabled ? "translate-x-5" : "translate-x-0"
                 )} />
               </button>
            </div>

            <Button
              onClick={openEdit}
              className="shrink-0 border border-white/20 bg-linear-to-r from-primary-500 to-tertiary-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
              size="sm"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              }}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {t("profile.menu.edit_profile")}
            </Button>
          </div>
        </div>
      </section>

      <section className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="relative flex flex-col items-center justify-center gap-3 border border-white/20 bg-white/5 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            }}
          >
            <Shapes className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-tertiary">
              {t("profile.preferences.preferred_category")}
            </div>
            <div className="mt-1 text-base font-bold text-text-primary">
              {preferredCategoryName}
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-col items-center justify-center gap-3 border border-white/20 bg-white/5 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center bg-tertiary-500/20 text-tertiary-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            }}
          >
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-text-tertiary">
              {t("profile.preferences.min_price")} /{" "}
              {t("profile.preferences.max_price")}
            </div>
            <div className="mt-1 text-base font-bold text-text-primary">
              {preferences?.min_price ?? "—"} - {preferences?.max_price ?? "—"}
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-col items-center gap-3 border border-white/20 bg-white/5 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:col-span-2 lg:col-span-1"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center bg-primary-500/20 text-primary-400 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            }}
          >
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
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                    }}
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
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="h-11 flex-1 border border-white/20 bg-linear-to-r from-primary-500 to-tertiary-500 text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              onClick={() => saveMutation.mutate()}
              disabled={busy}
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              }}
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