import type { ExploreListing } from "./explore";
import { leadsService, type PropertyLead } from "./leads";
import { requestJson } from "@/services/apiService/http";

export type ManagePropertyDetails = ExploreListing & {
  description: string;
  property_category: string;
  subcategory: string | null;
  is_negotiable?: boolean;
  show_exact_location?: boolean;
  state_id: string | null;
  district_id: string | null;
  municipality_id: string | null;
  ward_id: string | null;
  status: string;
  photo_urls: string[];
  is_story?: boolean;
};

export type ListingViewer = {
  viewer_user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  last_viewed_at: string | null;
};

export const manageService = {
  async getMyAds(): Promise<ExploreListing[]> {
    const { rows } = await requestJson<{ rows: ExploreListing[] }>("/api/manage/my-ads", { method: "POST" });
    return rows ?? [];
  },

  async toggleIsRented(propertyId: string, isRented: boolean): Promise<void> {
    await requestJson("/api/manage/toggle-rented", {
      method: "POST",
      body: JSON.stringify({ propertyId, isRented }),
    });
  },

  async getMyAdDetails(propertyId: string): Promise<ManagePropertyDetails> {
    const { row } = await requestJson<{ row: ManagePropertyDetails }>("/api/manage/ad-details", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    });
    return row;
  },

  async getMyLeads(listingId?: string | null): Promise<PropertyLead[]> {
    return leadsService.getLeadsForUser(listingId ?? null);
  },

  async getListingViewers(listingId: string): Promise<ListingViewer[]> {
    const { rows } = await requestJson<{ rows: ListingViewer[] }>("/api/manage/listing-viewers", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    return rows ?? [];
  },
};
