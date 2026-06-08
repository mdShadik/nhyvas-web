"use client";

import { useState, useEffect } from "react";

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("nhyvas_user_location");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isLocating, setIsLocating] = useState(!userLocation);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saveLocation = (loc: UserLocation) => {
      setUserLocation(loc);
      localStorage.setItem("nhyvas_user_location", JSON.stringify(loc));
    };

    if (!("geolocation" in navigator)) {
      const fallback = { latitude: 27.7172, longitude: 85.3240 }; // Kathmandu fallback
      saveLocation(fallback);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        saveLocation(next);
        setIsLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
        // Use fallback if no cached location already exists
        if (!userLocation) {
          const fallback = { latitude: 27.7172, longitude: 85.3240 };
          saveLocation(fallback);
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { userLocation, isLocating, error };
}
