import { PropertyPage } from "@/pageComponents";


export interface SearchParamsProps {
  id?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return <PropertyPage searchParams={params} />;
}