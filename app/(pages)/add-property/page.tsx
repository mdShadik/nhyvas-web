import { AddPropertyPage } from "@/pageComponents";
import { RequireAuth } from "@/components/profile/RequireAuth";

export interface SearchParamsProps {
  listingId?: string;
  categoryCode?: string;
  categoryId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return (
    <RequireAuth>
      <AddPropertyPage searchParams={params} />
    </RequireAuth>
  );
}
