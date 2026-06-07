"use client";

import { useState, useEffect } from "react";

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setUserLocation({ latitude: 27.7172, longitude: 85.3240 }); // Kathmandu fallback
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
        // Fallback to Kathmandu if user declined or error
        setUserLocation({ latitude: 27.7172, longitude: 85.3240 });
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { userLocation, isLocating, error };
}
