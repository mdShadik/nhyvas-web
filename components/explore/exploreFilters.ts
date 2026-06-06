import type { LocationSearchNode } from "@/services/apiService/explore";

export type FilterState = {
  categoryIds: string[];
  subcategoryIds: string[];
  locationNode: LocationSearchNode | null;
  minPrice: string;
  maxPrice: string;
  amenityIds: string[];
  nearMe: boolean;
  search: string;
};

export const EMPTY_FILTERS: FilterState = {
  categoryIds: [],
  subcategoryIds: [],
  locationNode: null,
  minPrice: "",
  maxPrice: "",
  amenityIds: [],
  nearMe: false,
  search: "",
};

