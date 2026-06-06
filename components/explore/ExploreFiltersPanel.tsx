"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  MapPin,
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
import { LocationSearch } from "@/components/address/LocationSearch";

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
  count += value.categoryIds.length;
  count += value.subcategoryIds.length;

  if (priceConfig) {
    if (value.minPrice && value.minPrice !== String(priceConfig.min_value)) count += 1;
    if (value.maxPrice && value.maxPrice !== String(priceConfig.max_value)) count += 1;
  } else {
    if (value.minPrice) count += 1;
    if (value.maxPrice) count += 1;
  }

  count += value.amenityIds.length;
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
    queryKey: ["explore", "subcategories", value.categoryIds],
    queryFn: () => exploreService.getSubcategoriesByCategoryIds(value.categoryIds),
    enabled: value.categoryIds.length > 0,
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
  }, [amenities, amenityCategories, t]);

  const activeCount = getActiveFilterCount(value, priceConfig);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];

    if (value.locationNode) {
      chips.push({ key: "location", label: value.locationNode.label });
    }

    if (value.categoryIds.length > 0) {
      if (value.categoryIds.length === 1) {
        const category = categories.find((c) => c.id === value.categoryIds[0]);
        const raw = category?.code || category?.name || value.categoryIds[0];
        chips.push({ key: "category", label: tPropertyCategory(raw) });
      } else {
        chips.push({
          key: "category",
          label: `${value.categoryIds.length} ${t("explore.categories", "categories")}`,
        });
      }
    }

    if (value.subcategoryIds.length > 0) {
      if (value.subcategoryIds.length === 1) {
        const sub = subcategories.find((s) => s.id === value.subcategoryIds[0]);
        const raw = sub?.code || sub?.name;
        chips.push({
          key: "subcategory",
          label: raw ? tPropertySubcategory(raw) : t("explore.subcategory", "Subcategory"),
        });
      } else {
        chips.push({
          key: "subcategory",
          label: `${value.subcategoryIds.length} ${t("explore.subcategories", "subcategories")}`,
        });
      }
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

    if (value.amenityIds.length) {
      chips.push({
        key: "amenities",
        label: `${value.amenityIds.length} ${value.amenityIds.length === 1 ? t("explore.amenity", "amenity") : t("explore.amenities", "amenities").toLowerCase()}`,
      });
    }

    return chips;
  }, [categories, priceConfig, subcategories, value]);

  return (
    <aside
      className={`w-full shrink-0 ${className ?? ""}`}
    >
      <div className="lg:sticky lg:top-24 h-full">
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100dvh-6rem)] overflow-hidden bg-page-bg-from">
          {/* Header - Simplified */}
          <div className="sticky top-0 z-10 border-b border-border/70 bg-page-bg-from px-5 py-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                    <SlidersHorizontal className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-lg font-black text-text-primary tracking-tight">
                    {t("explore.filters", "Filters")}
                  </h2>
               </div>
               {activeCount > 0 && (
                 <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-black text-white shadow-sm">
                    {activeCount}
                 </span>
               )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeChips.length ? (
                activeChips.map((chip) => (
                  <Pill
                    key={chip.key}
                    className="bg-bg-card text-text-secondary dark:bg-secondary-800 border border-border/60 shadow-xs"
                  >
                    {chip.label}
                  </Pill>
                ))
              ) : (
                <p className="text-xs text-text-tertiary font-medium">
                  {t("explore.showing_all_results", "Showing all results")}
                </p>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 px-5 py-5 overflow-y-auto overscroll-contain scrollbar-hide">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("explore.location", "Location")}
                </label>
                {value.locationNode ? (
                  <div
                    className="rounded-2xl border border-border bg-bg-input px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-text-primary">
                            {value.locationNode.label}
                          </div>
                          <div className="mt-0.5 text-xs text-text-tertiary">
                            {getHasPoint(value.locationNode) ? t("explore.nearby_search", "Nearby search radius: 2km") : t("explore.administrative_area", "Administrative area")}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onChange({ ...value, locationNode: null })}
                        className="rounded-full border border-border bg-bg-card p-2 text-text-secondary transition hover:border-primary-200 hover:text-text-primary"
                        aria-label={t("explore.clear_location", "Clear location")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <LocationSearch 
                    onSelect={(coord, label) => {
                      onChange({
                        ...value,
                        locationNode: {
                          id: `custom-${coord.latitude}-${coord.longitude}`,
                          label: label,
                          level: "ward", // Satisfies the type constraint while acting as a custom point
                          state_id: null,
                          district_id: null,
                          municipality_id: null,
                          ward_id: null,
                          latitude: coord.latitude,
                          longitude: coord.longitude
                        }
                      });
                    }}
                  />
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("explore.categories", "Categories")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.length === 0 ? (
                      <div className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-secondary italic">
                        {t("explore.loading_categories", "Loading categories…")}
                      </div>
                    ) : (
                      categories.map((cat) => {
                        const active = value.categoryIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const next = toggleInList(value.categoryIds, cat.id);
                              // When category is removed, also remove its subcategories
                              const nextSubIds = value.subcategoryIds.filter(sid => {
                                const sub = subcategories.find(s => s.id === sid);
                                return sub ? next.includes(sub.category_id) : true;
                              });

                              onChange({
                                ...value,
                                categoryIds: next,
                                subcategoryIds: nextSubIds
                              });
                            }}
                            className={`inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                              active
                                ? "border-primary-200 bg-primary-100 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
                                : "border-border bg-bg-input text-text-secondary hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary dark:hover:bg-secondary-800/70"
                            }`}
                          >
                            {tPropertyCategory(cat.code || cat.name || t("explore.category", "Category"))}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("explore.subcategories", "Subcategories")}
                  </label>
                  {value.categoryIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subcategories.length === 0 && subcategoriesQuery.isLoading ? (
                        <div className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-secondary italic">
                          {t("explore.loading_subcategories", "Loading subcategories…")}
                        </div>
                      ) : subcategories.length > 0 ? (
                        subcategories.map((sub) => {
                          const active = value.subcategoryIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...value,
                                  subcategoryIds: toggleInList(value.subcategoryIds, sub.id),
                                })
                              }
                              className={`inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                                active
                                  ? "border-primary-200 bg-primary-100 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
                                  : "border-border bg-bg-input text-text-secondary hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary dark:hover:bg-secondary-800/70"
                              }`}
                            >
                              {sub.code || sub.name
                                ? tPropertySubcategory(sub.code || sub.name)
                                : t("explore.subcategory", "Subcategory")}
                            </button>
                          );
                        })
                      ) : (
                        <div className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-secondary">
                          {t("explore.no_subcategories", "No subcategories found for selected categories.")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-secondary">
                      {t("explore.select_category_first", "Select category first")}
                    </div>
                  )}
                </div>
              </div>

              <PriceRangeField
                value={value}
                priceConfig={priceConfig}
                onChange={(next) => onChange({ ...value, ...next })}
              />

              <AmenitiesField
                groupedAmenities={groupedAmenities}
                selected={value.amenityIds}
                onToggle={(id) =>
                  onChange({
                    ...value,
                    amenityIds: toggleInList(value.amenityIds, id),
                  })
                }
              />
              {/* Spacer for bottom sticky footer on mobile */}
              <div className="h-4 lg:hidden" />
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="sticky bottom-[70px] z-10 border-t border-border bg-bg-card px-5 py-4 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>{t("explore.tip_combine", "Tip: combine location + one amenity for better results.")}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const reset: FilterState = {
                      ...EMPTY_FILTERS,
                      minPrice: priceConfig ? String(priceConfig.min_value) : "",
                      maxPrice: priceConfig ? String(priceConfig.max_value) : "",
                    };
                    onChange(reset);
                    onReset(reset);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-bg-input px-4 py-3 text-sm font-semibold text-text-primary transition active:scale-[0.98] hover:border-primary-200 hover:dark:border-tertiary-700 hover:bg-primary-50 hover:dark:bg-tertiary-500/30"
                >
                  {t("explore.reset", "Reset")}
                </button>

                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
                >
                  {t("explore.apply_filters", "Apply Filters")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
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

  const minValue =
    value.minPrice.trim() !== "" && Number.isFinite(Number(value.minPrice))
      ? Number(value.minPrice)
      : minLimit;
  const maxValue =
    value.maxPrice.trim() !== "" && Number.isFinite(Number(value.maxPrice))
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
  onToggle: (id: string) => void;
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
                    const active = selected.includes(amenity.id);

                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => onToggle(amenity.id)}
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
