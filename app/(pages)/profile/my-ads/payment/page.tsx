import Link from "next/link";

export interface SearchParamsProps {
  listingId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const listingId = params.listingId?.trim() ?? "";

  return (
    <main className="min-h-[60vh] px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-bg-page p-6 shadow-sm">
        <h1 className="text-xl font-bold text-text-primary">Listing Payment</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Payment collection for this listing will be added here.
        </p>
        {listingId ? (
          <p className="mt-4 rounded-xl bg-bg-input px-4 py-3 text-sm text-text-secondary">
            Listing ID: <span className="font-mono text-text-primary">{listingId}</span>
          </p>
        ) : null}
        <Link
          href="/profile/my-ads"
          className="mt-6 inline-flex items-center rounded-2xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to My Ads
        </Link>
      </div>
    </main>
  );
}
