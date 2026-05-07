"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { exploreService } from "@/services/apiService";
import noImagePlaceholder from "@/public/assets/images/noImagePlaceholder.png";

type Category = Awaited<ReturnType<typeof exploreService.getHomeCategories>>[number];
type HeroListing = Awaited<ReturnType<typeof exploreService.getHomeHeroListings>>[number];

export function formatPrice(amount: number, currencyCode: string) {
  try {
    const currency = (currencyCode || "NPR").toUpperCase();
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode || "NPR"}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Category Card                                                      */
/* ------------------------------------------------------------------ */
function CategoryCard({ category }: { category: Category }) {
  const name = (category.name || category.code || "Category").trim();
  return (
    <Link
      href={{
        pathname: "/explore",
        query: category.code ? { category: category.code } : undefined,
      }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-text-primary">{name}</div>
          <div className="mt-1 max-h-10 overflow-hidden text-sm text-text-secondary">
            {category.description || "Explore listings near you"}
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 transition group-hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:group-hover:bg-primary-900/60">
          View
        </div>
      </div>
      {/* decorative blob */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary-400/10 blur-2xl dark:bg-primary-400/15" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Listing Card                                                  */
/* ------------------------------------------------------------------ */
function HeroListingCard({ listing }: { listing: HeroListing }) {
  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="group flex min-w-[280px] max-w-[320px] flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary-100 dark:bg-secondary-500">
        {listing.thumbnail_url ? (
          <Image
            alt={listing.property_title}
            src={listing.thumbnail_url}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 90vw, 320px"
          />
        ) : (
          <Image
            alt={listing.property_title}
            src={noImagePlaceholder}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 90vw, 320px"
          />
        )}
        {listing.is_featured && (
          <div className="absolute left-3 top-3 rounded-full bg-primary-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm dark:bg-primary-500/80">
            Featured
          </div>
        )}
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="truncate text-sm font-semibold text-text-primary">
          {listing.property_title}
        </div>
        <div className="truncate text-sm text-text-secondary">
          {listing.location_text}
        </div>
        <div className="mt-2 text-base font-semibold text-accent">
          {formatPrice(listing.price, listing.currency_code)}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                   */
/* ------------------------------------------------------------------ */
function HeroSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[320px] animate-pulse overflow-hidden rounded-2xl border border-border bg-secondary-100 dark:bg-secondary-800">
      <div className="aspect-[16/10] w-full bg-secondary-200/70 dark:bg-secondary-700/50" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-secondary-200/70 dark:bg-secondary-700/50" />
        <div className="h-4 w-1/2 rounded bg-secondary-200/70 dark:bg-secondary-700/50" />
        <div className="h-5 w-2/3 rounded bg-secondary-200/70 dark:bg-secondary-700/50" />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="h-[92px] animate-pulse rounded-2xl border border-border bg-secondary-100 dark:bg-secondary-800" />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const [search, setSearch] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["home", "categories"],
    queryFn: () => exploreService.getHomeCategories(12),
  });

  const heroQuery = useQuery({
    queryKey: ["home", "hero"],
    queryFn: () => exploreService.getHomeHeroListings(8),
  });

  const categories = categoriesQuery.data ?? [];
  const heroListings = heroQuery.data ?? [];

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      `${c.code ?? ""} ${c.name ?? ""}`.toLowerCase().includes(q)
    );
  }, [categories, search]);

  return (
    <main className="flex-1 bg-gradient-to-br from-secondary-50 via-white to-primary-50 text-text-primary dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ---- Hero ------------------------------------------------ */}
        <section className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* left column */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              Find your next place in Nepal
            </h1>
            <p className="mt-3 max-w-prose text-base text-text-secondary">
              Browse verified listings, explore by category, and discover homes
              near you.
            </p>

            {/* search row */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="sr-only" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories (room, apartment, house…)"
                  className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-placeholder outline-none ring-primary-500/20 transition focus:border-primary-400 focus:ring-4"
                />
              </div>
              <Link
                href={{
                  pathname: "/explore",
                  query: search.trim() ? { q: search.trim() } : undefined,
                }}
                className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-500 active:bg-primary-700"
              >
                Search
              </Link>
            </div>

            {/* tech badges */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-text-tertiary">
              {["Next.js", "API routes", "Supabase server-only"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-secondary-200/60 px-3 py-1 dark:bg-secondary-700/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* right column – featured carousel card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">
              Featured
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              Fresh picks curated for you
            </div>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {heroQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <HeroSkeleton key={i} />
                ))
              ) : heroListings.length ? (
                heroListings.map((l) => (
                  <HeroListingCard key={l.id} listing={l} />
                ))
              ) : (
                <div className="text-sm text-text-secondary">
                  No featured listings yet.
                </div>
              )}
            </div>

            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-tertiary-400/10 blur-3xl dark:bg-tertiary-400/15" />
          </div>
        </section>

        {/* ---- Categories ------------------------------------------ */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                Browse categories
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Start with what you need
              </p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))
            ) : filteredCategories.length ? (
              filteredCategories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))
            ) : (
              <div className="text-sm text-text-secondary">
                No categories match your search.
              </div>
            )}
          </div>
        </section>

        {/* ---- Footer ---------------------------------------------- */}
        <footer className="mt-14 border-t border-border pt-8 text-sm text-text-tertiary">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Nhyvas</div>
            <div className="flex gap-4">
              <Link
                href="/help"
                className="transition hover:text-text-primary"
              >
                Help
              </Link>
              <Link
                href="/terms"
                className="transition hover:text-text-primary"
              >
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}