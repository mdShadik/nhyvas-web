import { AddressPickPage, ExplorePage } from "@/pageComponents";

export interface SearchParamsProps {
  addressId: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return <AddressPickPage searchParams={params} />;
}