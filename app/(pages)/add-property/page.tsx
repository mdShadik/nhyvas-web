"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";

import {
  exploreService,
  type HomeCategory,
  type LocationSearchNode,
  type MasterAmenity,
  type MasterAmenityCategory,
  type MasterSubcategory,
} from "@/services/apiService/explore";
import { manageService } from "@/services/apiService/manage";
import { uploadToR2 } from "@/services/apiService/media";
import { tAmenity, tAmenityCategory, tCurrency, tPropertyCategory, tPropertySubcategory } from "@/i18n/masterData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseOptionalInteger(value: string): number | null {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

type FormValues = {
  categoryCode: string;
  subcategoryId: string;
  propertyTitle: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  totalFloor: string;
  propertyFloorNo: string;
  totalAreaSqft: string;
  carpetAreaSqft: string;
  locationNode: LocationSearchNode | null;
  showExactLocation: boolean;
  enablePropertyStory: boolean;
  amenityIds: string[];
};

export default function AddPropertyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const listingId = (searchParams.get("listingId") ?? "").trim() || null;
  const initialCategoryCode = (searchParams.get("categoryCode") ?? "").trim() || "";
  const lockCategory = Boolean(initialCategoryCode);

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(Boolean(listingId));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [prefillDetails, setPrefillDetails] = useState<any | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<FormValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      categoryCode: initialCategoryCode,
      subcategoryId: "",
      propertyTitle: "",
      description: "",
      price: "",
      isNegotiable: true,
      totalFloor: "",
      propertyFloorNo: "",
      totalAreaSqft: "",
      carpetAreaSqft: "",
      locationNode: null,
      showExactLocation: false,
      enablePropertyStory: false,
      amenityIds: [],
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: () => exploreService.getHomeCategories(50),
  });

  const categoryCode = watch("categoryCode");
  const selectedCategory: HomeCategory | null = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    if (!categoryCode) return null;
    return rows.find((row) => row.code === categoryCode) ?? null;
  }, [categoriesQuery.data, categoryCode]);

  const subcategoriesQuery = useQuery({
    queryKey: ["explore", "subcategories", categoryCode],
    queryFn: () => exploreService.getSubcategoriesByCategoryCode(categoryCode),
    enabled: Boolean(categoryCode),
  });

  const subcategories: MasterSubcategory[] = subcategoriesQuery.data ?? [];
  const selectedSubcategoryId = watch("subcategoryId");
  const selectedSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId) ?? null;

  const amenityCategoriesQuery = useQuery({
    queryKey: ["explore", "amenity-categories"],
    queryFn: () => exploreService.getAmenityCategories(),
  });
  const amenitiesQuery = useQuery({
    queryKey: ["explore", "amenities"],
    queryFn: () => exploreService.getAmenities(),
  });

  const amenityCategories = amenityCategoriesQuery.data ?? [];
  const amenities = amenitiesQuery.data ?? [];

  const amenityIds = watch("amenityIds");
  useEffect(() => {
    if (!amenityIds.length) return;
    if (!amenities.length) return;
    const ids = new Set(amenities.map((a) => a.id));
    const nameToId = new Map(amenities.map((a) => [a.name, a.id] as const));
    const resolved = amenityIds
      .map((value) => (ids.has(value) ? value : nameToId.get(value) ?? value))
      .filter((v) => ids.has(v));
    const dedup = Array.from(new Set(resolved));
    const sameLength = dedup.length === amenityIds.length;
    const sameValues = sameLength && dedup.every((v, idx) => v === amenityIds[idx]);
    if (!sameValues) setValue("amenityIds", dedup, { shouldDirty: true });
  }, [amenities, amenityIds, setValue]);

  const groupedAmenities = useMemo(() => {
    const categories = amenityCategories
      .slice()
      .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0));

    const byCategory: Record<string, MasterAmenity[]> = {};
    for (const amenity of amenities) {
      const key = amenity.category_id ?? "uncategorized";
      (byCategory[key] ||= []).push(amenity);
    }

    return categories.map((cat) => ({
      ...cat,
      amenities: (byCategory[cat.id] ?? []).slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    }));
  }, [amenities, amenityCategories]);

  useEffect(() => {
    if (!listingId) return;

    const run = async () => {
      try {
        setIsPrefilling(true);
        const details = await manageService.getMyAdDetails(listingId);
        setPrefillDetails(details);
        setExistingPhotoUrls(details.photo_urls ?? []);
        reset({
          categoryCode: "",
          subcategoryId: "",
          propertyTitle: details.property_title ?? "",
          description: details.description ?? "",
          price: String(details.price ?? ""),
          isNegotiable: details.is_negotiable ?? true,
          totalFloor: details.total_floor != null ? String(details.total_floor) : "",
          propertyFloorNo: details.property_floor_no != null ? String(details.property_floor_no) : "",
          totalAreaSqft: details.total_area_sqft != null ? String(details.total_area_sqft) : "",
          carpetAreaSqft: details.carpet_area_sqft != null ? String(details.carpet_area_sqft) : "",
          locationNode: details.location_text
            ? ({
                level: "ward",
                id: "prefill",
                label: details.location_text,
                state_id: details.state_id ?? null,
                district_id: details.district_id ?? null,
                municipality_id: details.municipality_id ?? null,
                ward_id: details.ward_id ?? null,
                latitude: (details as any).latitude ?? null,
                longitude: (details as any).longitude ?? null,
              } satisfies LocationSearchNode)
            : null,
          showExactLocation: details.show_exact_location ?? false,
          enablePropertyStory: details.is_story ?? false,
          amenityIds: details.amenity_tags ?? [],
        });
      } catch (error: any) {
        showToast({
          variant: "error",
          title: t("common.error", "Error"),
          message: error?.message ?? "Could not load listing details.",
        });
        router.replace("/my-ads");
      } finally {
        setIsPrefilling(false);
      }
    };

    void run();
  }, [listingId, reset, router, showToast, t]);

  useEffect(() => {
    if (!listingId) return;
    if (!prefillDetails) return;
    const rows = categoriesQuery.data ?? [];
    if (!rows.length) return;

    const rawCategory = String(prefillDetails.property_category ?? "").trim();
    if (rawCategory && !watch("categoryCode")) {
      const matched = rows.find((r) => r.code === rawCategory) ?? rows.find((r) => r.name === rawCategory) ?? null;
      if (matched) setValue("categoryCode", matched.code, { shouldDirty: false });
    }
  }, [categoriesQuery.data, listingId, prefillDetails, setValue, watch]);

  const lastPrefilledSubcategoryNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (!listingId) return;
    if (!prefillDetails) return;
    if (!subcategories.length) return;
    if (watch("subcategoryId")) return;

    const name = String(prefillDetails.subcategory ?? "").trim();
    if (!name) return;
    if (lastPrefilledSubcategoryNameRef.current === name) return;
    lastPrefilledSubcategoryNameRef.current = name;
    const matched = subcategories.find((row) => row.name === name);
    if (matched) setValue("subcategoryId", matched.id, { shouldDirty: false });
  }, [listingId, prefillDetails, setValue, subcategories, watch]);

  const categoryLabel = tPropertyCategory(selectedCategory?.code ?? categoryCode ?? "Room");
  const countryName = t("landlord.create.country_nepal");

  const toggleAmenity = (amenityId: string) => {
    const next = new Set(watch("amenityIds"));
    if (next.has(amenityId)) next.delete(amenityId);
    else next.add(amenityId);
    setValue("amenityIds", Array.from(next), { shouldDirty: true, shouldTouch: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const parsedPrice = Number(values.price);
      const parsedTotalArea = parseOptionalNumber(values.totalAreaSqft);
      const parsedCarpetArea = parseOptionalNumber(values.carpetAreaSqft);
      const parsedTotalFloor = parseOptionalInteger(values.totalFloor);
      const parsedPropertyFloor = parseOptionalInteger(values.propertyFloorNo);

      const uploadUrls: string[] = [];
      for (const file of selectedFiles) {
        uploadUrls.push(
          await uploadToR2({
            file,
            folder: "listing-media",
          })
        );
      }

      const photo_urls = [...existingPhotoUrls, ...uploadUrls].slice(0, 10);

      await manageService.upsertListing({
        listingId,
        property_category: categoryLabel,
        subcategory: selectedSubcategory?.name ?? null,
        property_title: values.propertyTitle.trim(),
        description: values.description.trim(),
        price: parsedPrice,
        is_negotiable: values.isNegotiable,
        total_area_sqft: parsedTotalArea,
        carpet_area_sqft: parsedCarpetArea,
        total_floor: parsedTotalFloor,
        property_floor_no: parsedPropertyFloor,
        state_id: values.locationNode?.state_id ?? null,
        district_id: values.locationNode?.district_id ?? null,
        municipality_id: values.locationNode?.municipality_id ?? null,
        ward_id: values.locationNode?.ward_id ?? null,
        location_text: values.locationNode?.label?.trim() ?? "",
        latitude: values.locationNode?.latitude ?? null,
        longitude: values.locationNode?.longitude ?? null,
        show_exact_location: values.showExactLocation,
        is_story: values.enablePropertyStory,
        thumbnail_url: photo_urls[0] ?? null,
        photo_urls,
        amenity_tags: values.amenityIds,
      });

      showToast({
        variant: "success",
        title: listingId ? t("landlord.create.save_changes") : t("landlord.create.submit_for_review"),
        message: listingId ? "Your listing changes have been saved." : "Your listing has been sent for moderation.",
      });

      router.replace("/my-ads");
    } catch (error: any) {
      showToast({
        variant: "error",
        title: t("common.error", "Error"),
        message: error?.message ?? "Submission failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const ok = await trigger([
        "categoryCode",
        "subcategoryId",
        "propertyTitle",
        "description",
        "price",
        "totalFloor",
        "propertyFloorNo",
        "totalAreaSqft",
        "carpetAreaSqft",
        "locationNode",
      ]);
      if (!ok) {
        showToast({
          variant: "error",
          title: t("landlord.create.fix_fields_title"),
          message: t("landlord.create.fix_fields_message"),
        });
        return;
      }
    }

    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
    else void handleSubmit(onSubmit)();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {(isPrefilling || categoriesQuery.isLoading) ? (
        <div className="rounded-2xl border border-border bg-bg-card p-6 text-center text-text-secondary">
          {t("landlord.create.loading_listing")}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-text-tertiary">
            {t("landlord.create.step_of", { current: currentStep, total: totalSteps })}
          </div>

          {currentStep === 1 ? (
            <div className="space-y-5 rounded-2xl border border-border bg-bg-card p-5">
              <div className="text-base font-semibold text-text-primary">
                {t("landlord.create.basic_details")}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.category")}
                </label>
                <select
                  {...register("categoryCode", {
                    required: t("landlord.create.validation.category_required"),
                    onBlur: () => trigger("categoryCode"),
                  })}
                  value={watch("categoryCode")}
                  onChange={(e) => {
                    setValue("categoryCode", e.target.value, { shouldTouch: true, shouldValidate: true });
                    setValue("subcategoryId", "", { shouldTouch: true, shouldValidate: true });
                  }}
                  disabled={lockCategory || categoriesQuery.isLoading || !(categoriesQuery.data ?? []).length}
                  className={cn(
                    "w-full rounded-2xl border bg-bg-input px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-60",
                    touchedFields.categoryCode && errors.categoryCode ? "border-destructive" : "border-border"
                  )}
                >
                  <option value="" disabled>
                    {t("explore.select_category", "Select category")}
                  </option>
                  {(categoriesQuery.data ?? []).map((cat) => (
                    <option key={cat.id} value={cat.code}>
                      {tPropertyCategory(cat.code ?? cat.name)}
                    </option>
                  ))}
                </select>
                {touchedFields.categoryCode && errors.categoryCode?.message ? (
                  <div className="mt-2 text-xs text-destructive">{String(errors.categoryCode.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.subcategory")}
                </label>
                <select
                  {...register("subcategoryId", {
                    required: t("landlord.create.validation.subcategory_required"),
                    onBlur: () => trigger("subcategoryId"),
                  })}
                  disabled={!subcategories.length}
                  className={cn(
                    "w-full rounded-2xl border bg-bg-input px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-60",
                    touchedFields.subcategoryId && errors.subcategoryId ? "border-destructive" : "border-border"
                  )}
                >
                  <option value="" disabled>
                    {subcategories.length ? t("landlord.create.select_subcategory") : t("landlord.create.no_subcategories")}
                  </option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {tPropertySubcategory(sub.code ?? sub.name)}
                    </option>
                  ))}
                </select>
                {touchedFields.subcategoryId && errors.subcategoryId?.message ? (
                  <div className="mt-2 text-xs text-destructive">{String(errors.subcategoryId.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.ad_title")}
                </label>
                <Input
                  {...register("propertyTitle", {
                    required: t("landlord.create.validation.ad_title_required"),
                    onBlur: () => trigger("propertyTitle"),
                  })}
                  placeholder={t("landlord.create.placeholder.ad_title")}
                  className={touchedFields.propertyTitle && errors.propertyTitle ? "border-destructive" : undefined}
                />
                {touchedFields.propertyTitle && errors.propertyTitle?.message ? (
                  <div className="mt-2 text-xs text-destructive">{String(errors.propertyTitle.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.description")}
                </label>
                <textarea
                  {...register("description", {
                    required: t("landlord.create.validation.description_required"),
                    onBlur: () => trigger("description"),
                  })}
                  placeholder={t("landlord.create.placeholder.description")}
                  className={cn(
                    "min-h-28 w-full resize-y rounded-2xl border bg-bg-input px-4 py-3 text-sm text-text-primary outline-none placeholder:text-placeholder focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
                    touchedFields.description && errors.description ? "border-destructive" : "border-border"
                  )}
                />
                {touchedFields.description && errors.description?.message ? (
                  <div className="mt-2 text-xs text-destructive">{String(errors.description.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.price_label", { currency: tCurrency("NPR") })}
                </label>
                <Input
                  {...register("price", {
                    required: t("landlord.create.validation.price_required"),
                    validate: (value) => {
                      const v = String(value ?? "").trim();
                      if (!v) return t("landlord.create.validation.price_required");
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0) return t("landlord.create.validation.valid_price");
                      return true;
                    },
                    onBlur: () => trigger("price"),
                  })}
                  inputMode="numeric"
                  placeholder={t("landlord.create.placeholder.price_label")}
                  className={touchedFields.price && errors.price ? "border-destructive" : undefined}
                />
                {touchedFields.price && errors.price?.message ? (
                  <div className="mt-2 text-xs text-destructive">{String(errors.price.message)}</div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.total_floor")}
                  </label>
                  <Input
                    {...register("totalFloor", {
                      validate: (value) => {
                        const parsed = parseOptionalInteger(String(value ?? ""));
                        if (Number.isNaN(parsed) || ((parsed as number) < 0)) return t("landlord.create.validation.valid_total_floor");
                        return true;
                      },
                      onBlur: () => trigger(["totalFloor", "propertyFloorNo"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.total_floor")}
                    className={touchedFields.totalFloor && errors.totalFloor ? "border-destructive" : undefined}
                  />
                  {touchedFields.totalFloor && errors.totalFloor?.message ? (
                    <div className="mt-2 text-xs text-destructive">{String(errors.totalFloor.message)}</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.property_floor")}
                  </label>
                  <Input
                    {...register("propertyFloorNo", {
                      validate: (value) => {
                        const parsedPropertyFloor = parseOptionalInteger(String(value ?? ""));
                        if (Number.isNaN(parsedPropertyFloor) || ((parsedPropertyFloor as number) < 0)) {
                          return t("landlord.create.validation.valid_property_floor");
                        }
                        const parsedTotalFloor = parseOptionalInteger(String(watch("totalFloor") ?? ""));
                        if (
                          parsedPropertyFloor != null &&
                          parsedTotalFloor != null &&
                          !Number.isNaN(parsedTotalFloor) &&
                          (parsedPropertyFloor as number) > (parsedTotalFloor as number)
                        ) {
                          return t("landlord.create.validation.valid_property_floor_v2");
                        }
                        return true;
                      },
                      onBlur: () => trigger(["propertyFloorNo", "totalFloor"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.property_floor")}
                    className={touchedFields.propertyFloorNo && errors.propertyFloorNo ? "border-destructive" : undefined}
                  />
                  {touchedFields.propertyFloorNo && errors.propertyFloorNo?.message ? (
                    <div className="mt-2 text-xs text-destructive">{String(errors.propertyFloorNo.message)}</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.total_area")}
                  </label>
                  <Input
                    {...register("totalAreaSqft", {
                      validate: (value) => {
                        const parsed = parseOptionalNumber(String(value ?? ""));
                        if (Number.isNaN(parsed) || ((parsed as number) < 0)) return t("landlord.create.validation.valid_total_area");
                        return true;
                      },
                      onBlur: () => trigger(["totalAreaSqft", "carpetAreaSqft"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.total_area")}
                    className={touchedFields.totalAreaSqft && errors.totalAreaSqft ? "border-destructive" : undefined}
                  />
                  {touchedFields.totalAreaSqft && errors.totalAreaSqft?.message ? (
                    <div className="mt-2 text-xs text-destructive">{String(errors.totalAreaSqft.message)}</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.carpet_area")}
                  </label>
                  <Input
                    {...register("carpetAreaSqft", {
                      validate: (value) => {
                        const parsedCarpetArea = parseOptionalNumber(String(value ?? ""));
                        if (Number.isNaN(parsedCarpetArea) || ((parsedCarpetArea as number) < 0)) {
                          return t("landlord.create.validation.valid_carpet_area");
                        }
                        const parsedTotalArea = parseOptionalNumber(String(watch("totalAreaSqft") ?? ""));
                        if (
                          parsedCarpetArea != null &&
                          parsedTotalArea != null &&
                          !Number.isNaN(parsedTotalArea) &&
                          (parsedCarpetArea as number) > (parsedTotalArea as number)
                        ) {
                          return t("landlord.create.validation.valid_carpet_area_v2");
                        }
                        return true;
                      },
                      onBlur: () => trigger(["carpetAreaSqft", "totalAreaSqft"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.carpet_area")}
                    className={touchedFields.carpetAreaSqft && errors.carpetAreaSqft ? "border-destructive" : undefined}
                  />
                  {touchedFields.carpetAreaSqft && errors.carpetAreaSqft?.message ? (
                    <div className="mt-2 text-xs text-destructive">{String(errors.carpetAreaSqft.message)}</div>
                  ) : null}
                </div>
              </div>

              <Controller
                control={control}
                name="locationNode"
                rules={{ required: t("landlord.create.validation.location_required") as any }}
                render={({ field }) => (
                  <LocationPicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    label={t("landlord.create.location")}
                    placeholder={t("explore.search_location", "Search location...")}
                    helpText={countryName}
                    error={touchedFields.locationNode && errors.locationNode ? (errors.locationNode.message as any) : undefined}
                  />
                )}
              />

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-text-primary">
                  <input type="checkbox" {...register("isNegotiable")} className="mt-1 h-4 w-4 accent-primary" />
                  <span className="font-semibold">{t("landlord.create.negotiable")}</span>
                </label>

                <label className="flex items-start gap-3 text-sm text-text-primary">
                  <input type="checkbox" {...register("showExactLocation")} className="mt-1 h-4 w-4 accent-primary" />
                  <span>
                    <div className="font-semibold">{t("landlord.create.show_exact_location")}</div>
                    <div className="mt-1 text-xs text-text-tertiary">{t("landlord.create.show_exact_location_help")}</div>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-text-primary">
                  <input type="checkbox" {...register("enablePropertyStory")} className="mt-1 h-4 w-4 accent-primary" />
                  <span>
                    <div className="font-semibold">{t("landlord.create.enable_property_story")}</div>
                    <div className="mt-1 text-xs text-text-tertiary">{t("landlord.create.enable_property_story_help")}</div>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6 rounded-2xl border border-border bg-bg-card p-5">
              <div>
                <div className="text-base font-semibold text-text-primary">{t("listing_amenities.title")}</div>
                <div className="mt-1 text-sm text-text-tertiary">{t("listing_amenities.subtitle")}</div>
              </div>

              {(amenityCategoriesQuery.isLoading || amenitiesQuery.isLoading) ? (
                <div className="text-sm text-text-tertiary">{t("listing_amenities.loading")}</div>
              ) : (
                <div className="space-y-6">
                  {groupedAmenities.map((group: MasterAmenityCategory & { amenities: MasterAmenity[] }) => (
                    <div key={group.id} className="space-y-3">
                      <div className="text-sm font-semibold text-text-secondary">
                        {tAmenityCategory(group.code ?? group.name)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.amenities.map((amenity) => {
                          const active = (watch("amenityIds") ?? []).includes(amenity.id);
                          return (
                            <button
                              key={amenity.id}
                              type="button"
                              onClick={() => toggleAmenity(amenity.id)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                                active
                                  ? "border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200"
                                  : "border-border bg-bg-input text-text-secondary hover:border-primary-200 hover:text-text-primary"
                              )}
                            >
                              {tAmenity(amenity.code || amenity.name)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5 rounded-2xl border border-border bg-bg-card p-5">
              <div>
                <div className="text-base font-semibold text-text-primary">{t("listing_media.title", "Add Photos")}</div>
                <div className="mt-1 text-sm text-text-tertiary">
                  {t("listing_media.subtitle", "Upload visually appealing photos. You can add up to 10 photos.")}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-text-secondary">
                  {t("listing_media.select", "Select photos")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setSelectedFiles((prev) => [...prev, ...files].slice(0, 10));
                    e.target.value = "";
                  }}
                />
                <div className="text-xs text-text-tertiary">
                  {t("listing_media.tip_cover", "Tip: the first image becomes the cover photo.")}
                </div>
              </div>

              {(existingPhotoUrls.length || selectedFiles.length) ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-text-secondary">
                    {t("listing_media.selected", "Selected")} ({Math.min(existingPhotoUrls.length + selectedFiles.length, 10)})
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {existingPhotoUrls.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative overflow-hidden rounded-2xl border border-border bg-bg-input">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-28 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                        >
                          {t("common.remove", "Remove")}
                        </button>
                      </div>
                    ))}
                    {selectedFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="relative overflow-hidden rounded-2xl border border-border bg-bg-input">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt="" className="h-28 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                        >
                          {t("common.remove", "Remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end">
            <Button type="button" onClick={handleNext} disabled={isSubmitting || isPrefilling}>
              {isSubmitting
                ? listingId
                  ? t("landlord.create.saving")
                  : t("landlord.create.submitting")
                : currentStep === totalSteps
                  ? listingId
                    ? t("landlord.create.save_changes")
                    : t("landlord.create.submit_for_review")
                  : t("landlord.create.continue")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function LocationPicker({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  helpText,
  error,
}: {
  value: LocationSearchNode | null;
  onChange: (node: LocationSearchNode | null) => void;
  onBlur: () => void;
  label: string;
  placeholder: string;
  helpText: string;
  error?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    enabled: debouncedQuery.trim().length >= 1 && !value,
  });

  const results = searchQuery.data ?? [];

  return (
    <div ref={containerRef}>
      <label className="mb-2 block text-sm font-semibold text-text-secondary">
        {label}
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-primary">
          <div className="min-w-0">
            <div className="truncate font-semibold">{value.label}</div>
            <div className="mt-0.5 text-xs text-text-tertiary">{helpText}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-secondary transition hover:border-primary-200 hover:text-text-primary"
          >
            {t("explore.clear_location", "Clear location")}
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onBlur={onBlur}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-2xl border bg-bg-input px-4 py-3 text-sm text-text-primary outline-none placeholder:text-placeholder focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
              error ? "border-destructive" : "border-border"
            )}
          />

          {open && query.trim().length >= 1 ? (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-bg-card shadow-lg">
              {searchQuery.isLoading ? (
                <div className="px-4 py-3 text-sm text-text-tertiary">
                  {t("explore.loading", "Loading...")}
                </div>
              ) : results.length ? (
                <div className="max-h-72 overflow-auto">
                  {results.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      className="block w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-muted"
                      onClick={() => {
                        onChange(node);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-text-tertiary">
                  {t("explore.no_matches", "No matches found.")}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {error ? <div className="mt-2 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}

