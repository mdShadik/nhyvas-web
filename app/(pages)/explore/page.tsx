import { ExplorePage } from "@/pageComponents";

export interface SearchParamsProps {
  categoryCode?: string;
  categoryId?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  subcategoryId?: string;
  amenities?: string;
  location?: string;
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