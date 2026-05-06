import { requestJson } from "@/services/apiService/http";

export type PropertyLead = {
  id: string;
  property_id: string;
  inquirer_id: string;
  message: string | null;
  status: string;
  created_at: string;
  listing_title?: string | null;
  inquirer_name?: string | null;
  inquirer_phone?: string | null;
  inquirer_email?: string | null;
};

export const leadsService = {
  async createLead(propertyId: string, message?: string | null): Promise<void> {
    await requestJson("/api/leads/create", { method: "POST", body: JSON.stringify({ propertyId, message }) });
  },

  async getLeadsForUser(listingId?: string | null): Promise<PropertyLead[]> {
    const { rows } = await requestJson<{ rows: PropertyLead[] }>("/api/leads/list", {
      method: "POST",
      body: JSON.stringify({ listingId: listingId ?? null }),
    });
    return rows ?? [];
  },

  async getLeadsForListing(listingId: string): Promise<PropertyLead[]> {
    const { rows } = await requestJson<{ rows: PropertyLead[] }>("/api/leads/list", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    return rows ?? [];
  },
};

export type LeadsService = typeof leadsService;
