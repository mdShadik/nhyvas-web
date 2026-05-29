"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getGalliStyleUrl } from "@/lib/galliStyle";

type Center = { latitude: number; longitude: number };

type Props = {
  center: Center;
  radiusMeters: number;
  height?: number;
  gesturesEnabled?: boolean;
  active?: boolean;
  variant?: "pulse" | "pin";
  /** User cannot zoom out beyond the initial (computed) zoom. */
  lockMinZoom?: boolean;
  /** Max zoom user can zoom in to. */
  maxZoom?: number;
  /** Restrict panning to the initial viewport bounds. */
  lockPanToInitialBounds?: boolean;
};

const EARTH_RADIUS_M = 6378137;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function buildCirclePolygon(center: Center, radiusMeters: number, steps = 64) {
  const lat = toRadians(center.latitude);
  const lng = toRadians(center.longitude);
  const distance = radiusMeters / EARTH_RADIUS_M;

  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (2 * Math.PI * i) / steps;

    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(distance) +
        Math.cos(lat) * Math.sin(distance) * Math.cos(bearing)
    );

    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
        Math.cos(distance) - Math.sin(lat) * Math.sin(lat2)
      );

    coordinates.push([toDegrees(lng2), toDegrees(lat2)]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
  };
}

function zoomForRadius(radiusMeters: number) {
  const clamped = Math.max(50, Math.min(radiusMeters, 20000));
  const zoom = 16 - Math.log2(clamped / 150);
  return Math.max(10, Math.min(19, zoom));
}

export function CoverageMap({
  center,
  radiusMeters,
  height = 220,
  gesturesEnabled = true,
  active = true,
  variant = "pulse",
  lockMinZoom = true,
  maxZoom = 19,
  lockPanToInitialBounds = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const mapStyle = useMemo(() => getGalliStyleUrl(), []);
  const centerLngLat = useMemo(
    () => [center.longitude, center.latitude] as [number, number],
    [center.latitude, center.longitude]
  );
  const initialZoom = useMemo(
    () => (variant === "pin" ? 17 : zoomForRadius(radiusMeters)),
    [radiusMeters, variant]
  );

  // "Save the token": lock the initial zoom bounds for this map instance.
  const zoomLockRef = useRef<{ minZoom: number; maxZoom: number } | null>(null);
  const panLockRef = useRef<null | { west: number; east: number; south: number; north: number }>(null);

  const clampToPanBounds = (lng: number, lat: number) => {
    const b = panLockRef.current;
    if (!b) return { lng, lat };
    return {
      lng: Math.min(b.east, Math.max(b.west, lng)),
      lat: Math.min(b.north, Math.max(b.south, lat)),
    };
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    let disposed = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default as any;
      if (disposed) return;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: mapStyle,
        center: centerLngLat,
        zoom: initialZoom,
        attributionControl: false,
        interactive: gesturesEnabled,
      });

      mapRef.current = map;

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (disposed) return;

        const minZoomValue = lockMinZoom ? initialZoom : 0;
        const maxZoomValue = Math.max(minZoomValue, Math.min(maxZoom, 19));
        zoomLockRef.current = { minZoom: minZoomValue, maxZoom: maxZoomValue };
        map.setMinZoom(minZoomValue);
        map.setMaxZoom(maxZoomValue);

        if (lockPanToInitialBounds) {
          const bounds = map.getBounds();
          panLockRef.current = {
            west: bounds.getWest(),
            east: bounds.getEast(),
            south: bounds.getSouth(),
            north: bounds.getNorth(),
          };
          map.setMaxBounds([
            [panLockRef.current.west, panLockRef.current.south],
            [panLockRef.current.east, panLockRef.current.north],
          ]);
        }

        // Disable panning at the minimum zoom; enable only when user zooms in.
        if (gesturesEnabled) {
          map.dragPan.disable();
        }

        if (variant === "pin") {
          const marker = new maplibregl.Marker({ color: "#6366f1" })
            .setLngLat(centerLngLat)
            .addTo(map);
          markerRef.current = marker;
          return;
        }

        const base = buildCirclePolygon(center, radiusMeters, 72);
        const pulse = buildCirclePolygon(center, radiusMeters * 1.5, 72);

        map.addSource("coverage", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              { ...pulse, properties: { kind: "pulse", opacity: 0.22 } },
              { ...base, properties: { kind: "base" } },
            ],
          },
        });

        map.addLayer({
          id: "coverage-pulse",
          type: "fill",
          source: "coverage",
          filter: ["==", ["get", "kind"], "pulse"],
          paint: {
            "fill-color": "#6366f1",
            "fill-opacity": ["coalesce", ["get", "opacity"], 0.18],
          },
        });

        map.addLayer({
          id: "coverage-base",
          type: "fill",
          source: "coverage",
          filter: ["==", ["get", "kind"], "base"],
          paint: {
            "fill-color": "#6366f1",
            "fill-opacity": 0.12,
          },
        });

        map.addLayer({
          id: "coverage-outline",
          type: "line",
          source: "coverage",
          filter: ["==", ["get", "kind"], "base"],
          paint: {
            "line-color": "#6366f1",
            "line-width": 2,
            "line-opacity": 0.6,
          },
        });
      });

      map.on("zoomend", () => {
        const lock = zoomLockRef.current;
        if (!lock) return;
        const z = map.getZoom();
        if (z < lock.minZoom) map.setZoom(lock.minZoom);
        if (z > lock.maxZoom) map.setZoom(lock.maxZoom);

        // Allow panning only after zooming in.
        if (gesturesEnabled) {
          if (z <= lock.minZoom + 0.001) map.dragPan.disable();
          else map.dragPan.enable();
        }
      });

      map.on("moveend", () => {
        if (!lockPanToInitialBounds) return;
        const bounds = panLockRef.current;
        if (!bounds) return;

        const lock = zoomLockRef.current;
        const z = map.getZoom();
        if (lock && z <= lock.minZoom + 0.001) {
          // At min zoom, snap back to original center.
          map.setCenter(centerLngLat);
          return;
        }

        const c = map.getCenter();
        const clamped = clampToPanBounds(c.lng, c.lat);
        if (clamped.lng !== c.lng || clamped.lat !== c.lat) {
          map.setCenter([clamped.lng, clamped.lat]);
        }
      });

      map.on("move", () => {
        if (!lockPanToInitialBounds) return;
        const bounds = panLockRef.current;
        if (!bounds) return;
        const c = map.getCenter();
        const clamped = clampToPanBounds(c.lng, c.lat);
        if (clamped.lng !== c.lng || clamped.lat !== c.lat) {
          // Jumping the center is okay here; MapLibre will keep it inside bounds.
          map.setCenter([clamped.lng, clamped.lat]);
        }
      });
    })();

    return () => {
      disposed = true;
      try {
        markerRef.current?.remove?.();
      } catch {}
      try {
        mapRef.current?.remove?.();
      } catch {}
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [initialZoom, lockMinZoom, mapStyle, maxZoom, mounted, centerLngLat, gesturesEnabled, radiusMeters, variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!active) return;

    map.setCenter(centerLngLat);
    map.setZoom(initialZoom);

    const minZoomValue = lockMinZoom ? initialZoom : 0;
    const maxZoomValue = Math.max(minZoomValue, Math.min(maxZoom, 19));
    zoomLockRef.current = { minZoom: minZoomValue, maxZoom: maxZoomValue };
    map.setMinZoom(minZoomValue);
    map.setMaxZoom(maxZoomValue);

    if (lockPanToInitialBounds) {
      const bounds = map.getBounds();
      panLockRef.current = {
        west: bounds.getWest(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        north: bounds.getNorth(),
      };
      map.setMaxBounds([
        [panLockRef.current.west, panLockRef.current.south],
        [panLockRef.current.east, panLockRef.current.north],
      ]);
    } else {
      // Remove bounds restriction
      try {
        map.setMaxBounds(null as any);
      } catch {}
    }

    if (gesturesEnabled) {
      map.dragPan.disable();
    }

    if (variant === "pin") {
      markerRef.current?.setLngLat?.(centerLngLat);
      return;
    }

    const source = map.getSource?.("coverage");
    if (!source) return;

    let phase = 0;
    const interval = window.setInterval(() => {
      if (!mapRef.current) return;
      if (!active) return;
      phase = phase >= 1 ? 0 : phase + 0.05;
      const pulseRadius = radiusMeters * (1 + phase * 0.8);
      const pulseOpacity = Math.max(0, 0.28 - phase * 0.28);

      const base = buildCirclePolygon(center, radiusMeters, 72);
      const pulse = buildCirclePolygon(center, pulseRadius, 72);

      try {
        source.setData({
          type: "FeatureCollection",
          features: [
            { ...pulse, properties: { kind: "pulse", opacity: pulseOpacity } },
            { ...base, properties: { kind: "base" } },
          ],
        });
      } catch {}
    }, 80);

    return () => window.clearInterval(interval);
  }, [active, centerLngLat, gesturesEnabled, initialZoom, lockMinZoom, lockPanToInitialBounds, maxZoom, radiusMeters, variant]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-3xl border border-border bg-bg-card"
      style={{ height }}
    />
  );
}
