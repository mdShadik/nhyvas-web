import { ExplorePage } from "@/pageComponents";

export interface SearchParamsProps {
  categoryCode?: string;
  categoryId?: string;
  category?: string;
  categories?: string;
  minPrice?: string;
  maxPrice?: string;
  subcategoryId?: string;
  subcategories?: string;
  amenities?: string;
  location?: string;
  lat?: string;
  lng?: string;
  nearMe?: string;
  search?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return <ExplorePage searchParams={params} />;
}