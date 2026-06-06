"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X, Loader2, ArrowLeft, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { exploreService, ExploreListing } from "@/services/apiService/explore";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/formatPrice";

export function NavbarSearch() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExploreListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (window.innerWidth >= 640) {
           setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          // Search properties using text query
          const listings = await exploreService.getExploreListings({
             search: query.trim(),
             limit: 5 // Limit for dropdown
          });
          setResults(listings);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectProperty = (listing: ExploreListing) => {
    router.push(`/property?id=${listing.id}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.set("search", query.trim());
    router.push(`/explore?${params.toString()}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Search Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("common.search", "Search")}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
          isOpen
            ? "border-primary-400/20 bg-primary-400/12 text-primary-400"
            : "border-transparent text-text-secondary hover:border-border hover:bg-bg-input hover:text-text-primary"
        )}
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Desktop View */}
            <motion.div
              initial={{ width: 40, opacity: 0, x: 20 }}
              animate={{ width: 400, opacity: 1, x: 0 }}
              exit={{ width: 40, opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="hidden sm:flex absolute right-0 top-0 z-50 h-10 items-center overflow-hidden rounded-full border border-primary-400/30 bg-bg-card px-3 shadow-lg md:w-[500px]"
              style={{ width: "inherit" }}
            >
              <Search className="h-4.5 w-4.5 shrink-0 text-primary-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search_properties", "Search properties...")}
                className="mx-2 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary text-text-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) handleViewAll();
                  if (e.key === "Escape") setIsOpen(false);
                }}
              />
              <div className="flex items-center gap-1">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
                ) : query ? (
                  <button 
                    onClick={() => setQuery("")}
                    className="p-1 rounded-full hover:bg-bg-input"
                  >
                    <X className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
                  </button>
                ) : null}
                <div className="h-4 w-px bg-border mx-1" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-bg-input"
                >
                  <X className="h-4 w-4 text-text-secondary" />
                </button>
              </div>
            </motion.div>

            {/* Mobile View - Full Width Overlay */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sm:hidden fixed inset-x-0 top-0 z-[60] flex h-16 items-center bg-bg-card px-4 shadow-md"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="mr-3 flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-bg-input"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search_properties", "Search properties...")}
                className="flex-1 bg-transparent text-base outline-none placeholder:text-text-tertiary text-text-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) handleViewAll();
                }}
              />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              ) : query ? (
                <button 
                    onClick={() => setQuery("")}
                    className="ml-2 p-2"
                >
                  <X className="h-5 w-5 text-text-tertiary" />
                </button>
              ) : null}
            </motion.div>

            {/* Dropdown Results */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "fixed sm:absolute right-0 top-16 sm:top-full z-60 mt-0 sm:mt-2 w-full sm:w-[400px] md:sm:w-[500px] overflow-hidden bg-bg-card sm:rounded-2xl sm:border sm:border-border sm:shadow-xl",
                "h-[calc(100vh-64px)] sm:h-auto overflow-y-auto"
              )}
            >
              <div className="p-2 sm:p-3">
                {(results.length > 0 || isLoading) && (
                  <div className="mt-2 pt-2">
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-text-tertiary/60">
                      {t("common.property_results", "Properties")}
                    </div>
                    {results.map((listing) => (
                      <button
                        key={listing.id}
                        onClick={() => handleSelectProperty(listing)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-bg-input active:bg-bg-input"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary-100">
                          {listing.thumbnail_url ? (
                            <Image
                                src={listing.thumbnail_url}
                                alt={listing.property_title}
                                fill
                                className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Building2 className="h-6 w-6 text-text-secondary/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-text-primary truncate">
                            {listing.property_title}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-text-tertiary truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{listing.location_text}</span>
                          </div>
                          <div className="text-[12px] font-bold text-primary-600">
                             {formatPrice(listing.price, listing.currency_code)}
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {query.trim().length >= 2 && (
                       <button
                         onClick={handleViewAll}
                         className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary-400/20 bg-primary-400/5 py-3 text-sm font-bold text-primary-600 transition-all hover:bg-primary-400/10"
                       >
                         <span>{t("common.view_all_results", "View all results")}</span>
                         <ArrowRight className="h-4 w-4" />
                       </button>
                    )}
                  </div>
                )}

                {query.length >= 2 && results.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-2 rounded-full bg-secondary-100 p-3">
                        <Search className="h-6 w-6 text-text-tertiary" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">
                      {t("common.no_properties_found", "No properties found")}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                        {t("common.try_different_keyword", "Try a different keyword or check spelling")}
                    </p>
                  </div>
                )}
                
                {query.length < 2 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-text-tertiary">
                    <Search className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">
                      {t("common.type_to_search", "Type at least 2 characters to search")}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
