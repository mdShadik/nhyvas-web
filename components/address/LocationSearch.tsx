"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { galliMapService, type GalliSearchItem } from "@/services/galliMap";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  onSelect: (coord: { latitude: number; longitude: number }, label: string) => void;
  currentCoord?: { latitude: number; longitude: number } | null;
  className?: string;
}

export function LocationSearch({ onSelect, currentCoord, className }: LocationSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GalliSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const data = await galliMapService.searchWithCurrentLocation(
        query, 
        currentCoord?.latitude || 27.671, 
        currentCoord?.longitude || 85.4298
      );
      // Map FeatureCollection features to the format we need
      const mappedResults = data.features
        .filter(f => f.properties.searchedItem && f.geometry?.coordinates?.length >= 2)
        .map(f => {
          const latitude = f.geometry.coordinates[1];
          const longitude = f.geometry.coordinates[0];
          
          if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

          return {
            id: f.properties.searchedItem + Math.random(), // Galli currentLocation doesn't have unique IDs in properties
            name: f.properties.searchedItem,
            province: f.properties.province,
            district: f.properties.district,
            municipality: f.properties.municipality,
            ward: String(f.properties.ward || ""),
            geometry: f.geometry.type,
            nameLower: f.properties.searchedItem.toLowerCase(),
            distance: String(f.properties.distance || ""),
            coord: { latitude, longitude }
          };
        })
        .filter(Boolean);
      setResults(mappedResults as any);
      setShowDropdown(true);
    } catch (error) {
      console.error("Galli search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: any) => {
    if (item.coord && typeof item.coord.latitude === 'number' && typeof item.coord.longitude === 'number') {
        onSelect(item.coord, item.name);
        setQuery(item.name);
        setShowDropdown(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("addresses.search_placeholder", "Search location...")}
            className="pr-10 rounded-2xl"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
            </div>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !query.trim()}
          className="rounded-2xl shrink-0 w-12 h-12 p-0 bg-linear-to-br from-tertiary-500 to-primary-500 hover:opacity-90 border-0 transition-opacity"
        >
          <ArrowRight className="h-5 w-5 text-white" />
        </Button>
      </div>

      {showDropdown && results.length > 0 && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border bg-bg-card shadow-lg">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex w-full items-start gap-3 border-b border-border p-3 text-left transition hover:bg-bg-input last:border-0"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {[item.municipality, item.district, item.province].filter(Boolean).join(", ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
