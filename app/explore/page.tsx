"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/common/NavBar/NavBar";
import { exploreService, ExploreListing } from "@/services/apiService/explore";
import { MapPin, Heart, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../page";

function ListingCard({ listing }: { listing: ExploreListing }) {
  const { t } = useTranslation();
  
  // Use first photo or thumbnail
  const photoUrls = listing.photo_urls ?? [];
  const fallbackUri =
    typeof listing.thumbnail_url === "string" && listing.thumbnail_url.trim().length > 0
      ? listing.thumbnail_url.trim()
      : photoUrls[0] || null;

  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:shadow-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--input-bg)]">
        {fallbackUri ? (
          <Image
            alt={listing.property_title}
            src={fallbackUri}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
            No Image
          </div>
        )}

        {/* Watermarks */}
        <div className="pointer-events-none absolute left-3 top-3 opacity-20">
          <Image src="/assets/images/icon-n.png" alt="Nhyvas watermark" width={32} height={32} />
        </div>

        {/* Badges */}
        {listing.is_featured && (
          <div className="absolute left-14 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm">
            FEATURED
          </div>
        )}

        <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60">
          <Heart className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-lg font-bold text-[var(--title)]">
          {listing.property_title}
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-[var(--muted)]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">{listing.location_text}</span>
        </div>

        <div className="mt-1 text-sm text-[var(--muted)] truncate">
          {listing.property_category}
          {listing.subcategory ? ` • ${listing.subcategory}` : ""}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xl font-extrabold text-[var(--accent)]">
            {formatPrice(listing.price, listing.currency_code)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [listings, setListings] = useState<ExploreListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("");

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await exploreService.getExploreListings({
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        category: category || null,
        limit: 50,
      });
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []); // Initial load

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="px-4 sm:px-6">
        <NavBar />
      </div>

      <main className="flex flex-1 gap-6 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Explore Properties</h1>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Find your perfect home from {listings.length} available properties.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-[340px] rounded-2xl bg-[var(--border)]/50 animate-pulse" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
              <Search className="mb-4 h-12 w-12 text-[var(--muted)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No properties found</h3>
              <p className="mt-2 max-w-sm text-[var(--color-text-secondary)]">
                We couldn't find any properties matching your criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Filters */}
        <aside className="w-80 shrink-0 hidden md:block">
          <div className="sticky top-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Filters</h2>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                  Category
                </label>
                <select 
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--accent)] transition"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                  Price Range
                </label>
                <div className="flex gap-3">
                  <input 
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--accent)] transition"
                  />
                  <input 
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <button 
                onClick={fetchListings}
                className="w-full rounded-xl bg-[var(--accent)] py-3.5 font-bold text-white transition hover:bg-[var(--accent)]/90 shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
