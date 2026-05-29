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
    try {
      let url = `/api/map/search?word=${encodeURIComponent(query)}`;
      if (lat !== undefined && lng !== undefined) {
        url += `&currentLat=${lat}&currentLng=${lng}`;
      }

      const response = await fetch(url);
      if (!response.ok) return [];
      const result: GalliSearchResult = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("Galli search error:", error);
      return [];
    }
  },

  async searchWithCurrentLocation(query: string, lat: number, lng: number): Promise<GalliCurrentLocationSearchResult["data"]> {
    try {
      const url = `/api/map/search?word=${encodeURIComponent(query)}&currentLat=${lat}&currentLng=${lng}`;
      const response = await fetch(url);
      if (!response.ok) return { type: "FeatureCollection", features: [] };
      const result: GalliCurrentLocationSearchResult = await response.json();
      return result.success ? result.data : { type: "FeatureCollection", features: [] };
    } catch (error) {
      console.error("Galli current location search error:", error);
      return { type: "FeatureCollection", features: [] };
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<GalliReverseResult["data"] | null> {
    try {
      const url = `/api/map/reverse?lat=${lat}&lng=${lng}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const result: GalliReverseResult = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("Galli reverse geocode error:", error);
      return null;
    }
  },
};
