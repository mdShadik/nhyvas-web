import type { ExploreListing } from "@/services/apiService/explore";
import { mapExploreListingRow } from "@/services/apiService/mappers";
import { requestJson } from "@/services/apiService/http";

export type FavouriteListingRow = {
  listing_id: string;
  user_id: string;
  created_at: string;
};

export type SavedListing = ExploreListing & {
  favourited_at: string;
};

export const favouritesService = {
  async getMyFavouriteListingIdsForListings(listingIds: string[]): Promise<string[]> {
    const { ids } = await requestJson<{ ids: string[] }>("/api/favourites/ids", {
      method: "POST",
      body: JSON.stringify({ listingIds }),
    });
    return ids ?? [];
  },

  async addFavourite(listingId: string): Promise<void> {
    await requestJson("/api/favourites/add", { method: "POST", body: JSON.stringify({ listingId }) });
  },

  async removeFavourite(listingId: string): Promise<void> {
    await requestJson("/api/favourites/remove", { method: "POST", body: JSON.stringify({ listingId }) });
  },

  async getMySavedListings(limit = 50, offset = 0): Promise<SavedListing[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/favourites/saved", {
      method: "POST",
      body: JSON.stringify({ limit, offset }),
    });
    return (rows ?? []).map((row: any) => mapExploreListingRow(row) as SavedListing);
  },
};

export type FavouritesService = typeof favouritesService;
