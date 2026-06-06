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

export type PropertyViewer = {
  viewer_user_id: string;
  full_name: string;
  phone: string;
  email: string;
  avatar_url: string | null;
  last_viewed_at: string;
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

  async getPropertyViewers(listingId: string): Promise<PropertyViewer[]> {
    const { viewers } = await requestJson<{ viewers: PropertyViewer[] }>("/api/activity/viewers", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    return viewers ?? [];
  },

  async recordPropertyView(listingId: string): Promise<void> {
    await requestJson("/api/activity/record-view", {
      method: "POST",
      body: JSON.stringify({ listingId, source: "property_details" }),
    });
  },
  async hasViewedListing(listingId: string): Promise<boolean> {
    const { viewed } = await requestJson<{ viewed: boolean }>("/api/activity/has-viewed", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    return Boolean(viewed);
  },
};
