import type { ExploreListing } from "@/services/apiService/explore";

export function mapExploreListingRow(row: any): ExploreListing {
  return {
    ...row,
    price: Number(row.price),
    photo_urls: row.photo_urls ?? [],
    amenity_tags: row.amenity_tags ?? [],
  } as ExploreListing;
}

export function mapExploreListingRows(rows: any[] | null | undefined): ExploreListing[] {
  return (rows ?? []).map(mapExploreListingRow);
}

