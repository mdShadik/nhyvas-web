"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTomTomStyleUrl } from "@/lib/tomtomStyle";
import { cn } from "@/lib/utils";
import { useCallbackRef } from "@/hooks/useCallbackRef";

export type Coordinate = { latitude: number; longitude: number };

const NEPAL_BOUNDS = {
  west: 80.058,
  south: 26.347,
  east: 88.201,
  north: 30.447,
};

const DEFAULT_NEPAL_CENTER: Coordinate = {
  latitude: 27.671,
  longitude: 85.4298,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampToNepal(coord: Coordinate): Coordinate {
  return {
    latitude: clamp(coord.latitude, NEPAL_BOUNDS.south, NEPAL_BOUNDS.north),
    longitude: clamp(coord.longitude, NEPAL_BOUNDS.west, NEPAL_BOUNDS.east),
  };
}

function isInsideNepal(coord: Coordinate) {
  return (
    coord.longitude >= NEPAL_BOUNDS.west &&
    coord.longitude <= NEPAL_BOUNDS.east &&
    coord.latitude >= NEPAL_BOUNDS.south &&
    coord.latitude <= NEPAL_BOUNDS.north
  );
}

export function AddressMapPicker({
  value,
  onChange,
  onLocate,
  locating = false,
  className,
}: {
  value: Coordinate | null;
  onChange: (coord: Coordinate) => void;
  onLocate?: () => void;
  locating?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const [mounted, setMounted] = useState(false);

  const mapStyle = useMemo(() => getTomTomStyleUrl(), []);

  const initialCenter = useMemo(() => {
    if (value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) {
      return clampToNepal(value);
    }
    return DEFAULT_NEPAL_CENTER;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeRef = useCallbackRef(onChange);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return;

    let disposed = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default as any;
      if (disposed) return;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: mapStyle,
        center: [initialCenter.longitude, initialCenter.latitude],
        zoom: 16,
        attributionControl: false,
        interactive: true,
      });

      mapRef.current = map;

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();

      map.setMaxBounds([
        [NEPAL_BOUNDS.west, NEPAL_BOUNDS.south],
        [NEPAL_BOUNDS.east, NEPAL_BOUNDS.north],
      ]);

      const emitCenter = () => {
        const c = map.getCenter();
        const next = clampToNepal({
          latitude: c.lat,
          longitude: c.lng,
        });
        onChangeRef(next);
      };

      map.on("load", () => {
        if (disposed) return;
        emitCenter();
      });

      map.on("moveend", emitCenter);
    })();

    return () => {
      disposed = true;
      try {
        mapRef.current?.remove?.();
      } catch {}
      mapRef.current = null;
    };
  }, [mounted, mapStyle, initialCenter, onChangeRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    const current = map.getCenter?.();
    if (!current) return;

    const dist = Math.abs(current.lat - value.latitude) + Math.abs(current.lng - value.longitude);
    if (dist < 0.00002) return;

    map.easeTo({
      center: [value.longitude, value.latitude],
      duration: 600,
    });
  }, [value?.latitude, value?.longitude, value]);

  const insideNepal = value ? isInsideNepal(value) : true;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <MapPin className="h-4 w-4 text-primary-500" />
            <span>{t("navigation.pick_address")}</span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {t("addresses.map_hint")}
          </p>
        </div>

        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label={t("addresses.use_current_location")}
          className={cn(
            "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition",
            "hover:bg-[var(--color-secondary-100)] dark:hover:bg-[var(--color-secondary-800)]",
            "disabled:pointer-events-none disabled:opacity-60"
          )}
        >
          <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
          <span className="hidden sm:inline">
            {locating ? t("addresses.locating") : t("addresses.use_current_location")}
          </span>
        </button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="h-[320px] w-full sm:h-[380px] lg:h-[460px]"
        />

        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-full">
          <div className="mx-auto flex w-fit flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg ring-4 ring-primary-500/20 sm:h-12 sm:w-12">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="-mt-1.5 h-4 w-4 rotate-45 rounded-[3px] bg-primary-500 shadow-md" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/10 to-transparent p-3 sm:p-4">
          {!value ? (
            <div className="w-fit rounded-2xl border border-white/40 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-200">
              {t("addresses.map_hint")}
            </div>
          ) : !insideNepal ? (
            <div className="w-fit rounded-2xl border border-red-200 bg-red-50/95 px-3 py-2 text-xs text-red-700 shadow-sm backdrop-blur dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {t("addresses.nepal_only")}
            </div>
          ) : (
            <div className="w-fit rounded-2xl border border-white/40 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-200">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}