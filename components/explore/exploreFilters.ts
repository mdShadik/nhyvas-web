import type { LocationSearchNode } from "@/services/apiService/explore";

export type FilterState = {
  categoryId: string | null;
  subcategoryId: string | null;
  locationNode: LocationSearchNode | null;
  minPrice: string;
  maxPrice: string;
  amenityIds: string[];
  nearMe: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  categoryId: null,
  subcategoryId: null,
  locationNode: null,
  minPrice: "",
  maxPrice: "",
  amenityIds: [],
  nearMe: false,
};

