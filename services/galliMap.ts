import { requestJson } from "@/services/apiService/http";

const GALLI_MAP_API_KEY = process.env.NEXT_PUBLIC_GALLI_MAP_API_KEY;

export interface GalliSearchItem {
  name: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  geometry: string;
  nameLower: string;
  id: string;
  distance?: string;
}

export interface GalliSearchResult {
  success: boolean;
  message: string;
  data: GalliSearchItem[];
}

export interface GalliReverseResult {
  success: boolean;
  message: string;
  data: {
    generalName: string;
    roadName: string;
    place: string;
    municipality: string;
    ward: string;
    district: string;
    province: string;
  };
}

export interface GalliCurrentLocationSearchResult {
    success: boolean;
    message: string;
    data: {
        type: "FeatureCollection";
        features: Array<{
            type: "Feature";
            properties: {
                searchedItem: string;
                province: string;
                district: string;
                municipality: string;
                ward: string;
                distance: number;
            };
            geometry: {
                type: string;
                coordinates: [number, number]; // [longitude, latitude]
            };
        }>;
    };
}

export const galliMapService = {
  async search(query: string, lat?: number, lng?: number): Promise<GalliSearchItem[]> {
    if (!GALLI_MAP_API_KEY) throw new Error("Galli Map API key is missing");
    
    let url = `https://route-init.gallimap.com/api/v1/search/autocomplete?accessToken=${GALLI_MAP_API_KEY}&word=${encodeURIComponent(query)}`;
    if (lat !== undefined && lng !== undefined) {
      url += `&lat=${lat}&lng=${lng}`;
    }

    const response = await fetch(url);
    const result: GalliSearchResult = await response.json();
    return result.success ? result.data : [];
  },

  async searchWithCurrentLocation(query: string, lat: number, lng: number): Promise<GalliCurrentLocationSearchResult["data"]> {
    if (!GALLI_MAP_API_KEY) throw new Error("Galli Map API key is missing");

    const url = `https://route-init.gallimap.com/api/v1/search/currentLocation?accessToken=${GALLI_MAP_API_KEY}&name=${encodeURIComponent(query)}&currentLat=${lat}&currentLng=${lng}`;
    const response = await fetch(url);
    const result: GalliCurrentLocationSearchResult = await response.json();
    return result.success ? result.data : { type: "FeatureCollection", features: [] };
  },

  async reverseGeocode(lat: number, lng: number): Promise<GalliReverseResult["data"] | null> {
    if (!GALLI_MAP_API_KEY) throw new Error("Galli Map API key is missing");

    const url = `https://route-init.gallimap.com/api/v1/reverse/generalReverse?accessToken=${GALLI_MAP_API_KEY}&lat=${lat}&lng=${lng}`;
    const response = await fetch(url);
    const result: GalliReverseResult = await response.json();
    return result.success ? result.data : null;
  },
};
