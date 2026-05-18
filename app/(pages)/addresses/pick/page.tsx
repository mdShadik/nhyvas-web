"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { MapPin, Save, ChevronLeft, LocateFixed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { AddressMapPicker, type Coordinate } from "@/components/address/AddressMapPicker";
import { Button } from "@/components/ui/button";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";

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

function AddressPickContent() {
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
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

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

  const picker = (
    <AddressMapPicker
      value={coord}
      onChange={(next) => void settleCoordinate(next)}
      onLocate={useCurrentLocation}
      locating={locating}
      className="order-1 h-full"
    />
  );

  return (
    <RequireAuth>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 lg:px-8 lg:pt-8">
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                <span>{editing ? t("addresses.edit_address") : t("navigation.pick_address")}</span>
              </div>

              <h1 className="mt-3 text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
                {t("navigation.pick_address")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                {t("addresses.empty_hint")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="shrink-0 rounded-2xl"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.cancel")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,420px)] lg:gap-6">
            <div>
              {picker}
            </div>

            <aside className="order-2">
              <div className="rounded-3xl border border-border bg-bg-card p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-text-primary">
                      {t("navigation.pick_address")}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {resolvingAdmin
                        ? t("addresses.locating")
                        : adminLabel ||
                          (coord
                            ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                            : t("addresses.map_hint"))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-border bg-bg-input p-3 sm:p-4">
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <div className="rounded-2xl border border-dashed border-border px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                        Coordinates
                      </div>
                      <div className="mt-1 text-sm text-text-primary">
                        {coord
                          ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                          : "--"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-border px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                        Area
                      </div>
                      <div className="mt-1 text-sm text-text-primary wrap-break-word">
                        {adminLabel || "--"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    type="button"
                    onClick={onSave}
                    className="h-11 rounded-2xl bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
                  >
                    <Save className="mr-2 h-4 w-4 " />
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
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile Layout: Full screen map + bottom sheet with address form */}
      {isMobile ? (
      <div className="lg:hidden fixed inset-0">
        <div className="h-full w-full">
          <AddressMapPicker
            value={coord}
            onChange={(next) => void settleCoordinate(next)}
            onLocate={useCurrentLocation}
            locating={locating}
            fullScreen={true}
            className="h-full"
          />
        </div>

	        <MobileBottomSheet
	          open={true}
	          onClose={() => {}}
	          title={t("navigation.pick_address")}
	          modal={false}
	          disableDismiss={true}
	          snapPoints={[0, 0.3, 0.6, 1]}
	          initialSnap={1}
	          minSnap={0.3}
	        >
          <aside>
            <div className="rounded-3xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-text-primary">
                    {t("navigation.pick_address")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {resolvingAdmin
                      ? t("addresses.locating")
                      : adminLabel ||
                        (coord
                          ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                          : t("addresses.map_hint"))}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border p-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-2xl border border-dashed border-border px-3 py-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                      Coordinates
                    </div>
                    <div className="mt-1 text-sm text-text-primary">
                      {coord
                        ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`
                        : "--"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-border px-3 py-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                      Area
                    </div>
                    <div className="mt-1 text-sm text-text-primary wrap-break-word">
                      {adminLabel || "--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  onClick={onSave}
                  className="h-11 rounded-2xl bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
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
                  className="h-11 rounded-2xl"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </aside>
        </MobileBottomSheet>
      </div>
      ) : null}
    </RequireAuth>
  );
}

export default function AddressPickPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddressPickContent />
    </Suspense>
  );
}
