import { queryClient } from "@/services/queryClient";
import type { ExploreListing } from "@/services/apiService/explore";

export function setListingPreview(listing: ExploreListing) {
  queryClient.setQueryData(["listing-preview", listing.id], listing);
}

export function getListingPreview(id: string): ExploreListing | undefined {
  return queryClient.getQueryData<ExploreListing>(["listing-preview", id]);
}
