import type { LocationSearchNode } from "@/services/apiService/explore";

export type FilterState = {
  categoryCode: string | null;
  subcategoryId: string | null;
  locationNode: LocationSearchNode | null;
  minPrice: string;
  maxPrice: string;
  amenityIds: string[];
};

export const EMPTY_FILTERS: FilterState = {
  categoryCode: null,
  subcategoryId: null,
  locationNode: null,
  minPrice: "",
  maxPrice: "",
  amenityIds: [],
};

