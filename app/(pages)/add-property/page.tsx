import { AddPropertyPage } from "@/pageComponents";

export interface SearchParamsProps {
  listingId?: string;
  categoryCode?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return <AddPropertyPage searchParams={params} />;
}