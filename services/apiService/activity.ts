import type { ExploreListing } from "./explore";
import { mapExploreListingRow } from "@/services/apiService/mappers";
import { requestJson } from "@/services/apiService/http";

export type UserRecentlyViewed = {
  id: string;
  user_id: string;
  property_id: string;
  viewed_at: string;
  listing?: ExploreListing;
};

export type RecentlyViewedItem = {
  viewed_at: string;
  listing: ExploreListing;
};

export const activityService = {
  async getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/activity/recently-viewed", { method: "POST" });
    
    return (rows ?? []).map((row: any) => ({
      viewed_at: row.viewed_at,
      listing: {
        ...mapExploreListingRow(row),
      } as ExploreListing,
    })) as RecentlyViewedItem[];
  },

  async recordPropertyView(propertyId: string): Promise<void> {
    await requestJson("/api/activity/record-view", {
      method: "POST",
      body: JSON.stringify({ propertyId, source: "property_details" }),
    });
  },
  async hasViewedListing(propertyId: string): Promise<boolean> {
    const { viewed } = await requestJson<{ viewed: boolean }>("/api/activity/has-viewed", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    });
    return Boolean(viewed);
  },
};
