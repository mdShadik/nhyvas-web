"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { exploreService } from "@/services/apiService";

type Category = Awaited<ReturnType<typeof exploreService.getHomeCategories>>[number];
type HeroListing = Awaited<ReturnType<typeof exploreService.getHomeHeroListings>>[number];

function formatPrice(amount: number, currencyCode: string) {
  try {
    const currency = (currencyCode || "NPR").toUpperCase();
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currencyCode || "NPR"}`;
  }
}

function CategoryCard({ category }: { category: Category }) {
  const name = (category.name || category.code || "Category").trim();
  return (
    <Link
      href={{ pathname: "/explore", query: category.code ? { category: category.code } : undefined }}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{name}</div>
          {category.description ? (
            <div className="mt-1 max-h-10 overflow-hidden text-sm text-zinc-600 dark:text-zinc-400">
              {category.description}
            </div>
          ) : (
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Explore listings near you</div>
          )}
        </div>
        <div className="shrink-0 rounded-full bg-zinc-900/5 px-2.5 py-1 text-xs font-medium text-zinc-800 group-hover:bg-zinc-900/10 dark:bg-zinc-100/10 dark:text-zinc-100 dark:group-hover:bg-zinc-100/15">
          View
        </div>
      </div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl dark:bg-indigo-500/15" />
    </Link>
  );
}

function HeroListingCard({ listing }: { listing: HeroListing }) {
  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="group flex min-w-[280px] max-w-[320px] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {listing.thumbnail_url ? (
          <Image
            alt={listing.property_title}
            src={listing.thumbnail_url}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 90vw, 320px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No image</div>
        )}
        {listing.is_featured ? (
          <div className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur dark:bg-zinc-100/15">
            Featured
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{listing.property_title}</div>
        <div className="truncate text-sm text-zinc-600 dark:text-zinc-400">{listing.location_text}</div>
        <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {formatPrice(listing.price, listing.currency_code)}
        </div>
      </div>
    </Link>
  );
}

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
    return categories.filter((c) => `${c.code ?? ""} ${c.name ?? ""}`.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <main className="flex-1 bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              N
            </div>
            <div className="text-base font-semibold tracking-tight">Nhyvas</div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/explore"
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-200 dark:hover:bg-zinc-100/10"
            >
              Explore
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Login
            </Link>
          </nav>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find your next place in Nepal</h1>
            <p className="mt-3 max-w-prose text-base text-zinc-600 dark:text-zinc-400">
              Browse verified listings, explore by category, and discover homes near you.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="sr-only" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories (room, apartment, house...)"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500/20 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
              <Link
                href={{ pathname: "/explore", query: search.trim() ? { q: search.trim() } : undefined }}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Search
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="rounded-full bg-zinc-900/5 px-3 py-1 dark:bg-zinc-100/10">Next.js</span>
              <span className="rounded-full bg-zinc-900/5 px-3 py-1 dark:bg-zinc-100/10">API routes</span>
              <span className="rounded-full bg-zinc-900/5 px-3 py-1 dark:bg-zinc-100/10">Supabase server-only</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="text-sm font-semibold">Featured</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Fresh picks curated for you</div>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {heroQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[280px] max-w-[320px] animate-pulse overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900"
                  >
                    <div className="aspect-[16/10] w-full bg-zinc-200/70 dark:bg-zinc-800/70" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                      <div className="h-4 w-1/2 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                      <div className="h-5 w-2/3 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                    </div>
                  </div>
                ))
              ) : heroListings.length ? (
                heroListings.map((l) => <HeroListingCard key={l.id} listing={l} />)
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">No featured listings yet.</div>
              )}
            </div>

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Browse categories</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Start with what you need</p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[92px] animate-pulse rounded-2xl border border-zinc-200/70 bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900"
                />
              ))
            ) : filteredCategories.length ? (
              filteredCategories.map((c) => <CategoryCard key={c.id} category={c} />)
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">No categories match your search.</div>
            )}
          </div>
        </section>

        <footer className="mt-14 border-t border-zinc-200/70 pt-8 text-sm text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Nhyvas</div>
            <div className="flex gap-4">
              <Link href="/help" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Help
              </Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
