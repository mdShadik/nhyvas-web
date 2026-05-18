"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { exploreService } from "@/services/apiService";
import type {
  LocationSearchNode,
  MasterAmenity,
  MasterAmenityCategory,
  MasterPriceConfig,
} from "@/services/apiService/explore";
import {
  EMPTY_FILTERS,
  type FilterState,
} from "@/components/explore/exploreFilters";
import { Slider } from "../ui/slider";
import {
  tAmenity,
  tAmenityCategory,
  tCurrency,
  tPriceRangeLabel,
  tPropertyCategory,
  tPropertySubcategory,
} from "@/i18n/masterData";
import { useTranslation } from "react-i18next";

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onApply: () => void;
  onReset: (reset: FilterState) => void;
  className?: string;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toggleInList(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function getHasPoint(node: LocationSearchNode | null) {
  const lat = Number(node?.latitude);
  const lng = Number(node?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currencyCode || "NPR").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode || "NPR"}`;
  }
}

function getActiveFilterCount(
  value: FilterState,
  priceConfig: MasterPriceConfig | null
) {
  let count = 0;

  if (value.locationNode) count += 1;
  if (value.categoryCode) count += 1;
  if (value.subcategoryId) count += 1;

  if (priceConfig) {
    if (value.minPrice && value.minPrice !== String(priceConfig.min_value)) count += 1;
    if (value.maxPrice && value.maxPrice !== String(priceConfig.max_value)) count += 1;
  } else {
    if (value.minPrice) count += 1;
    if (value.maxPrice) count += 1;
  }

  count += value.amenityNames.length;
  return count;
}

function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function ExploreFiltersPanel({
  value,
  onChange,
  onApply,
  onReset,
  className,
}: Props) {
  const { t } = useTranslation();
  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: () => exploreService.getHomeCategories(200),
  });

  const priceConfigQuery = useQuery({
    queryKey: ["explore", "price-config", "mobile_search_default"],
    queryFn: () => exploreService.getPriceRangeConfig("mobile_search_default"),
  });

  const amenitiesQuery = useQuery({
    queryKey: ["explore", "amenities"],
    queryFn: () => exploreService.getAmenities(),
  });

  const amenityCategoriesQuery = useQuery({
    queryKey: ["explore", "amenity-categories"],
    queryFn: () => exploreService.getAmenityCategories(),
  });

  const subcategoriesQuery = useQuery({
    queryKey: ["explore", "subcategories", value.categoryCode],
    queryFn: () => exploreService.getSubcategoriesByCategoryCode(value.categoryCode!),
    enabled: Boolean(value.categoryCode),
  });

  const categories = categoriesQuery.data ?? [];
  const subcategories = subcategoriesQuery.data ?? [];
  const amenities = amenitiesQuery.data ?? [];
  const amenityCategories = amenityCategoriesQuery.data ?? [];
  const priceConfig = priceConfigQuery.data ?? null;

  useEffect(() => {
    if (!priceConfig) return;

    onChange({
      ...value,
      minPrice: value.minPrice || String(priceConfig.min_value),
      maxPrice: value.maxPrice || String(priceConfig.max_value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceConfig?.id]);

  const groupedAmenities = useMemo(() => {
    const byCategory: Record<string, MasterAmenity[]> = {};

    for (const amenity of amenities) {
      const key = amenity.category_id ?? "uncategorized";
      (byCategory[key] ||= []).push(amenity);
    }

    const groups = (amenityCategories as MasterAmenityCategory[]).map((category) => ({
      ...category,
      amenities: byCategory[category.id] ?? [],
    }));

    const uncategorized = byCategory.uncategorized ?? [];
    if (uncategorized.length) {
      groups.push({
        id: "uncategorized",
        code: "uncategorized",
        name: t("explore.other", "Other"),
        display_order: 9999,
        amenities: uncategorized,
      });
    }

    return groups;
  }, [amenities, amenityCategories]);

  const activeCount = getActiveFilterCount(value, priceConfig);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];

    if (value.locationNode) {
      chips.push({ key: "location", label: value.locationNode.label });
    }

    if (value.categoryCode) {
      const category = categories.find((c) => c.code === value.categoryCode);
      const raw = category?.code || category?.name || value.categoryCode;
      chips.push({ key: "category", label: tPropertyCategory(raw) });
    }

    if (value.subcategoryId) {
      const sub = subcategories.find((s) => s.id === value.subcategoryId);
      const raw = sub?.code || sub?.name;
      chips.push({
        key: "subcategory",
        label: raw ? tPropertySubcategory(raw) : t("explore.subcategory", "Subcategory"),
      });
    }

    if (priceConfig) {
      const min = Number(value.minPrice || priceConfig.min_value);
      const max = Number(value.maxPrice || priceConfig.max_value);
      const isDefault = min === priceConfig.min_value && max === priceConfig.max_value;

      if (!isDefault) {
        chips.push({
          key: "price",
          label: `${formatMoney(min, priceConfig.currency_code)} – ${formatMoney(
            max,
            priceConfig.currency_code
          )}`,
        });
      }
    }

    if (value.amenityNames.length) {
      chips.push({
        key: "amenities",
        label: `${value.amenityNames.length} ${value.amenityNames.length === 1 ? t("explore.amenity", "amenity") : t("explore.amenities", "amenities").toLowerCase()}`,
      });
    }

    return chips;
  }, [categories, priceConfig, subcategories, value]);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full shrink-0 ${className ?? ""}`}
    >
      <div className="lg:sticky lg:top-24">
        <div className="flex flex-col lg:h-full lg:max-h-[calc(100dvh-6rem)] lg:overflow-hidden bg-page-bg-from shadow-[0_18px_55px_-30px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_55px_-30px_rgba(2,6,23,0.7)]">
          {/* Header */}
          <div className="relative border-b border-border/70 px-5 py-5">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary-500/5 via-transparent to-tertiary-500/5" />

            <div className="relative flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                <SlidersHorizontal className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-tertiary">
                  {t("explore.explore_filters", "Explore filters")}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-text-primary">
                  {t("explore.refine_search", "Refine search")}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {t("explore.narrow_results", "Narrow results by location, price, and amenities.")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill className="bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                {activeCount} {t("common.active", "active")}
              </Pill>

              {activeChips.length ? (
                activeChips.map((chip) => (
                  <Pill
                    key={chip.key}
                    className="bg-secondary-100 text-text-secondary dark:bg-secondary-800"
                  >
                    {chip.label}
                  </Pill>
                ))
              ) : (
                <Pill className="bg-secondary-100 text-text-secondary dark:bg-secondary-800">
                  {t("explore.all_filters_open", "All filters open")}
                </Pill>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 px-5 py-5 lg:overflow-y-auto">
            <div className="space-y-6">
              <LocationSearchField
                value={value.locationNode}
                onChange={(node) => onChange({ ...value, locationNode: node })}
              />

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("explore.category", "Category")}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-2xl border border-border bg-bg-input px-4 py-3 pr-10 text-text-primary outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15"
                      value={value.categoryCode ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          categoryCode: e.target.value || null,
                          subcategoryId: null,
                        })
                      }
                    >
                      <option value="">{t("explore.all_categories", "All categories")}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                          {tPropertyCategory(cat.code || cat.name || t("explore.category", "Category"))}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("explore.subcategory", "Subcategory")}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-2xl border border-border bg-bg-input px-4 py-3 pr-10 text-text-primary outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      value={value.subcategoryId ?? ""}
                      disabled={!value.categoryCode}
                      onChange={(e) =>
                        onChange({ ...value, subcategoryId: e.target.value || null })
                      }
                    >
                      <option value="">
                        {value.categoryCode ? t("explore.all_subcategories", "All subcategories") : t("explore.select_category_first", "Select category first")}
                      </option>
                      {subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code || sub.name
                            ? tPropertySubcategory(sub.code || sub.name)
                            : t("explore.subcategory", "Subcategory")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  </div>
                </div>
              </div>

              <PriceRangeField
                value={value}
                priceConfig={priceConfig}
                onChange={(next) => onChange({ ...value, ...next })}
              />

              <AmenitiesField
                groupedAmenities={groupedAmenities}
                selected={value.amenityNames}
                onToggle={(name) =>
                  onChange({
                    ...value,
                    amenityNames: toggleInList(value.amenityNames, name),
                  })
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-bg-card px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>{t("explore.tip_combine", "Tip: combine location + one amenity for better results.")}</span>
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const reset: FilterState = {
                      ...EMPTY_FILTERS,
                      minPrice: priceConfig ? String(priceConfig.min_value) : "",
                      maxPrice: priceConfig ? String(priceConfig.max_value) : "",
                    };
                    onChange(reset);
                    onReset(reset);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-bg-input px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-primary-200 hover:dark:border-tertiary-700 hover:bg-primary-50 hover:dark:bg-tertiary-500/30"
                >
                  {t("explore.reset", "Reset")}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onApply}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-linear-to-br hover:from-tertiary-500 hover:to-primary-500 from-primary-500 via-primary-500 to-tertiary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-400"
                >
                  {t("explore.apply_filters", "Apply Filters")}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function LocationSearchField({
  value,
  onChange,
}: {
  value: LocationSearchNode | null;
  onChange: (node: LocationSearchNode | null) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.label);
      return;
    }
    setQuery("");
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const debouncedQuery = useDebouncedValue(query, 250);

  const searchQuery = useQuery({
    queryKey: ["explore", "location-search", debouncedQuery],
    queryFn: () => exploreService.searchLocationNodes(debouncedQuery, 30),
    enabled: debouncedQuery.trim().length >= 1,
  });

  const results = searchQuery.data ?? [];

  useEffect(() => {
    setHighlightedIndex(0);
  }, [results.length]);

  return (
    <div ref={containerRef}>
      <label className="mb-2 block text-sm font-semibold text-text-secondary">
        {t("explore.location", "Location")}
      </label>

      {value ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-bg-input px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                <MapPin className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text-primary">
                  {value.label}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  {getHasPoint(value) ? t("explore.nearby_search", "Nearby search radius: 2km") : t("explore.administrative_area", "Administrative area")}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="rounded-full border border-border bg-bg-card p-2 text-text-secondary transition hover:border-primary-200 hover:text-text-primary"
              aria-label={t("explore.clear_location", "Clear location")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            <Search className="h-4 w-4" />
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open) return;

              if (e.key === "Escape") {
                setOpen(false);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  clampNumber(prev + 1, 0, Math.max(0, results.length - 1))
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  clampNumber(prev - 1, 0, Math.max(0, results.length - 1))
                );
              } else if (e.key === "Enter") {
                const node = results[highlightedIndex];
                if (!node) return;
                e.preventDefault();
                onChange(node);
                setQuery("");
                setOpen(false);
              }
            }}
            placeholder={t("explore.search_location", "Search location...")}
            className="w-full rounded-2xl border border-border bg-bg-input py-3 pl-10 pr-10 text-text-primary outline-none transition placeholder:text-placeholder focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-tertiary transition hover:bg-secondary-100 hover:text-text-primary dark:hover:bg-secondary-800"
              aria-label={t("explore.clear_search", "Clear search")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-bg-card shadow-xl"
              >
                {debouncedQuery.trim().length < 1 ? (
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    {t("explore.type_to_search", "Type to search locations.")}
                  </div>
                ) : searchQuery.isFetching ? (
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    {t("common.searching", "Searching…")}
                  </div>
                ) : results.length ? (
                  <ul className="max-h-72 overflow-auto py-1">
                    {results.map((row, idx) => (
                      <li key={`${row.level}-${row.id}`}>
                        <motion.button
                          type="button"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            onChange(row);
                            setQuery("");
                            setOpen(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                            idx === highlightedIndex
                              ? "bg-primary-50 dark:bg-secondary-800"
                              : "hover:bg-secondary-50 dark:hover:bg-secondary-800/70"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-text-primary">
                              {row.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-text-tertiary">
                              {row.level}
                            </span>
                          </span>

                          {getHasPoint(row) ? (
                            <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                              {t("explore.nearby", "Nearby")}
                            </span>
                          ) : null}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    {t("explore.no_matches", "No matches found.")}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function PriceRangeField({
  value,
  priceConfig,
  onChange,
}: {
  value: FilterState;
  priceConfig: MasterPriceConfig | null;
  onChange: (next: Pick<FilterState, "minPrice" | "maxPrice">) => void;
}) {
  const { t } = useTranslation();
  const minLimit = priceConfig?.min_value ?? 0;
  const maxLimit = priceConfig?.max_value ?? 100000;
  const step = priceConfig?.step_value ?? 1000;
  const currency = priceConfig?.currency_code ?? "NPR";
  const label = tPriceRangeLabel(
    "mobile_search_default",
    priceConfig?.label ?? t("explore.price_range", "Price range")
  );

  const minValue = Number.isFinite(Number(value.minPrice))
    ? Number(value.minPrice)
    : minLimit;
  const maxValue = Number.isFinite(Number(value.maxPrice))
    ? Number(value.maxPrice)
    : maxLimit;

  const safeMin = clampNumber(minValue, minLimit, maxLimit);
  const safeMax = clampNumber(maxValue, minLimit, maxLimit);
  const normalizedMin = Math.min(safeMin, safeMax);
  const normalizedMax = Math.max(safeMin, safeMax);

  useEffect(() => {
    if (normalizedMin === minValue && normalizedMax === maxValue) return;

    onChange({
      minPrice: String(normalizedMin),
      maxPrice: String(normalizedMax),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedMin, normalizedMax]);

  return (
    <div className="rounded-3xl border border-border bg-bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary">
            {label}
          </label>
          <p className="mt-1 text-xs text-text-tertiary">
            {t("explore.drag_handles", "Drag the handles to set your budget")}
          </p>
        </div>

        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
          {tCurrency(currency)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-bg-input px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("explore.min", "Min")}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-primary">
            {formatMoney(normalizedMin, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-input px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("explore.max", "Max")}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-primary">
            {formatMoney(normalizedMax, currency)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-bg-input p-4">
        <Slider
          value={[normalizedMin, normalizedMax]}
          min={minLimit}
          max={maxLimit}
          step={step}
          minStepsBetweenThumbs={1}
          onValueChange={(next) => {
            const [nextMin = minLimit, nextMax = maxLimit] = next;
            onChange({
              minPrice: String(Math.min(nextMin, nextMax)),
              maxPrice: String(Math.max(nextMin, nextMax)),
            });
          }}
          className="w-full"
        />

        <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
          <span>{formatMoney(minLimit, currency)}</span>
          <span>{formatMoney(maxLimit, currency)}</span>
        </div>
      </div>
    </div>
  );
}

function AmenitiesField({
  groupedAmenities,
  selected,
  onToggle,
}: {
  groupedAmenities: Array<MasterAmenityCategory & { amenities: MasterAmenity[] }>;
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-text-secondary">
            {t("explore.amenities", "Amenities")}
          </label>
          <p className="mt-1 text-xs text-text-tertiary">
            {t("explore.tap_to_select", "Tap to select or deselect")}
          </p>
        </div>

        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
          {selected.length} {t("explore.selected", "selected")}
        </span>
      </div>

      <div className="space-y-2">
        {groupedAmenities.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-secondary">
            {t("explore.loading_amenities", "Loading amenities…")}
          </div>
        ) : (
          groupedAmenities.map((group) => (
            <details
              key={group.id}
              className="group rounded-3xl border border-border bg-bg-card px-4 py-3"
            >
              <summary className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-text-primary">
                <span>{tAmenityCategory(group.code || group.name)}</span>

                {group.amenities.length ? (
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-medium text-text-tertiary dark:bg-secondary-800">
                    {group.amenities.length}
                  </span>
                ) : null}

                <ChevronDown className="ml-auto h-4 w-4 text-text-tertiary transition-transform duration-200 group-open:rotate-180" />
              </summary>

              {group.amenities.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.amenities.map((amenity) => {
                    const active = selected.includes(amenity.name);

                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => onToggle(amenity.name)}
                        aria-pressed={active}
                        className={`inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "border-primary-200 bg-primary-100 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
                            : "border-border bg-bg-input text-text-secondary hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary dark:hover:bg-secondary-800/70"
                        }`}
                      >
                        {tAmenity(amenity.code || amenity.name)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm text-text-secondary">
                  {t("explore.no_amenities_category", "No amenities in this category.")}
                </div>
              )}
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
