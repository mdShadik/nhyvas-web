"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Save, ChevronLeft, LocateFixed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { AddressMapPicker, type Coordinate } from "@/components/address/AddressMapPicker";
import { Button } from "@/components/ui/button";

import { useToast } from "@/context/ToastContext";
import { useAddressBook } from "@/hooks/useAddressBook";
import { lookupNepalAdminAtPoint, type NepalLookupResult } from "@/services/nepalLocations";

const DEFAULT_NEPAL_CENTER: Coordinate = {
  latitude: 27.671,
  longitude: 85.4298,
};

function formatAdmin(admin: NepalLookupResult | null) {
  if (!admin) return "";
  const parts = [
    admin.ward?.name_en,
    admin.municipality?.name_en,
    admin.district?.name_en,
    admin.state?.name_en,
  ].filter(Boolean) as string[];

  return parts.join(", ");
}

export default function AddressPickPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useSearchParams();

  const addressId = (params.get("addressId") ?? "").trim() || null;
  const { entries, add, update } = useAddressBook();

  const editing = useMemo(
    () => (addressId ? entries.find((e) => e.id === addressId) ?? null : null),
    [addressId, entries]
  );

  const [coord, setCoord] = useState<Coordinate | null>(null);
  
  const [adminLabel, setAdminLabel] = useState("");
  const [locating, setLocating] = useState(false);
  const [resolvingAdmin, setResolvingAdmin] = useState(false);

  const reverseReqIdRef = useRef(0);

  useEffect(() => {
    if (!editing) return;

    const nextCoord =
      typeof editing.latitude === "number" && typeof editing.longitude === "number"
        ? { latitude: editing.latitude, longitude: editing.longitude }
        : DEFAULT_NEPAL_CENTER;

    setCoord(nextCoord);
    
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    setCoord(DEFAULT_NEPAL_CENTER);
  }, [editing]);

  const settleCoordinate = useCallback(
    async (next: Coordinate) => {
      setCoord(next);
      const reqId = (reverseReqIdRef.current += 1);
      setResolvingAdmin(true);

      try {
        const admin = await lookupNepalAdminAtPoint(next.latitude, next.longitude);
        if (reqId !== reverseReqIdRef.current) return;

        const formatted = formatAdmin(admin);
        setAdminLabel(formatted);
        
      } catch {
        if (reqId !== reverseReqIdRef.current) return;
        setAdminLabel("");
      } finally {
        if (reqId === reverseReqIdRef.current) {
          setResolvingAdmin(false);
        }
      }
    },
    []
  );

  const useCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      showToast({
        variant: "error",
        message: "Geolocation not supported on this device",
      });
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        void settleCoordinate(next);
        setLocating(false);
      },
      () => {
        showToast({
          variant: "error",
          message: "Unable to get location",
        });
        setLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
      }
    );
  }, [settleCoordinate, showToast]);

  const onSave = () => {


    const latitude = coord?.latitude ?? null;
    const longitude = coord?.longitude ?? null;

    if (editing) {
      update(editing.id, {
        label: adminLabel,
        latitude,
        longitude,
      });
      showToast({
        variant: "success",
        message: t("addresses.updated"),
      });
    } else {
      add({
        id: null,
        label: adminLabel,
        latitude,
        longitude,
      });
      showToast({
        variant: "success",
        message: t("addresses.saved"),
      });
    }

    router.push("/addresses");
  };

  return (
    <RequireAuth>
      <div className="min-h-dvh bg-[var(--color-bg-page)]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                <span>{editing ? t("addresses.edit_address") : t("navigation.pick_address")}</span>
              </div>

              <h1 className="mt-3 text-xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                {t("navigation.pick_address")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                {t("addresses.empty_hint")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="hidden shrink-0 rounded-2xl sm:inline-flex"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.cancel")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,420px)] lg:gap-6">
            <AddressMapPicker
              value={coord}
              onChange={(next) => void settleCoordinate(next)}
              onLocate={useCurrentLocation}
              locating={locating}
              className="order-1"
            />

            <aside className="order-2">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                      {t("navigation.pick_address")}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {resolvingAdmin
                        ? t("addresses.locating")
                        : adminLabel ||
                          (coord
                            ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                            : t("addresses.map_hint"))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-3 sm:p-4">


                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        Coordinates
                      </div>
                      <div className="mt-1 text-sm text-[var(--color-text-primary)]">
                        {coord
                          ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                          : "--"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        Area
                      </div>
                      <div className="mt-1 text-sm text-[var(--color-text-primary)] break-words">
                        {adminLabel || "--"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    type="button"
                    onClick={onSave}
                    className="h-11 rounded-2xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {t("common.continue")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="h-11 rounded-2xl"
                  >
                    <LocateFixed className="mr-2 h-4 w-4" />
                    {locating ? t("addresses.locating") : t("addresses.use_current_location")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="h-11 rounded-2xl sm:col-span-2 lg:col-span-1 sm:hidden"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}