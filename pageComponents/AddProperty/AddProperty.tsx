"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

import {
  exploreService,
  type HomeCategory,
  type MasterAmenity,
  type MasterAmenityCategory,
  type MasterSubcategory,
} from "@/services/apiService/explore";
import {
  manageService,
  type ManagePropertyDetails,
} from "@/services/apiService/manage";
import { profileService } from "@/services/apiService/profile";
import { getCachedListing } from "@/stores/myAdsStore";
import { uploadToR2 } from "@/services/apiService/media";
import {
  tAmenity,
  tAmenityCategory,
  tCurrency,
  tPropertyCategory,
  tPropertySubcategory,
} from "@/i18n/masterData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { useAddressBook } from "@/hooks/useAddressBook";
import { cn } from "@/lib/utils";
import { lookupNepalAdminAtPoint } from "@/services/nepalLocations";
import { SearchParamsProps } from "@/app/(pages)/add-property/page";

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

/** Nepal mobile: optional +977 / 977 prefix, then 9XXXXXXXXX (10 digits). */
function normalizeNepalMobile(raw: string): string | null {
  const compact = raw.replace(/\s+/g, "").trim();
  if (!compact) return null;
  let d = compact.startsWith("+") ? compact.slice(1) : compact;
  if (d.startsWith("977")) d = d.slice(3);
  if (/^9\d{9}$/.test(d)) return `+977${d}`;
  return null;
}

type FormValues = {
  categoryId: string;
  subcategoryId: string;
  propertyTitle: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  totalFloor: string;
  propertyFloorNo: string;
  totalAreaSqft: string;
  carpetAreaSqft: string;
  landlordPhone: string;
  amenityIds: string[];
};

type PrefillDetails = Partial<ManagePropertyDetails> & Record<string, unknown>;

interface Props {
  searchParams: SearchParamsProps;
}

export default function AddPropertyPage({ searchParams }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();

  const listingId =
    (searchParams.listingId && searchParams.listingId.trim()) || "";
  const initialCategoryId = (searchParams.categoryId ?? "").trim() || "";
  const lockCategory = Boolean(initialCategoryId);
  const { entries: addressEntries, defaultId: defaultAddressId } =
    useAddressBook();

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(Boolean(listingId));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [prefillDetails, setPrefillDetails] = useState<PrefillDetails | null>(
    null,
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [prefilledLocation, setPrefilledLocation] = useState<{
    label: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);

  const {
    register,
    control,
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
      categoryId: initialCategoryId,
      subcategoryId: "",
      propertyTitle: "",
      description: "",
      price: "",
      isNegotiable: true,
      totalFloor: "",
      propertyFloorNo: "",
      totalAreaSqft: "",
      carpetAreaSqft: "",
      landlordPhone: "",
      amenityIds: [],
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: () => exploreService.getHomeCategories(50),
  });

  const categoryIdValue = watch("categoryId");
  const selectedCategory: HomeCategory | null = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    if (!categoryIdValue) return null;
    return rows.find((row) => row.id === categoryIdValue) ?? null;
  }, [categoriesQuery.data, categoryIdValue]);

  const subcategoriesQuery = useQuery({
    queryKey: ["explore", "subcategories", categoryIdValue],
    queryFn: () => exploreService.getSubcategoriesByCategoryIds([categoryIdValue]),
    enabled: Boolean(categoryIdValue),
  });

  const subcategories: MasterSubcategory[] = subcategoriesQuery.data ?? [];
  const selectedSubcategoryId = watch("subcategoryId");
  const selectedSubcategory =
    subcategories.find((s) => s.id === selectedSubcategoryId) ?? null;
  const selectedAddressEntry = useMemo(() => {
    if (!selectedAddressId) return null;
    return (
      addressEntries.find((entry) => entry.id === selectedAddressId) ?? null
    );
  }, [addressEntries, selectedAddressId]);
  const selectedLocation = useMemo(() => {
    if (selectedAddressEntry) {
      if (
        selectedAddressEntry.latitude == null ||
        selectedAddressEntry.longitude == null
      ) {
        return null;
      }
      return {
        label: selectedAddressEntry.label,
        latitude: selectedAddressEntry.latitude,
        longitude: selectedAddressEntry.longitude,
      };
    }
    return prefilledLocation;
  }, [prefilledLocation, selectedAddressEntry]);
  const locationError =
    locationTouched && !selectedLocation
      ? t("landlord.create.validation.location_required")
      : undefined;

  useEffect(() => {
    if (selectedAddressId) return;
    if (listingId && prefilledLocation) return;
    if (!addressEntries.length) return;
    setSelectedAddressId(defaultAddressId ?? addressEntries[0]!.id);
  }, [
    addressEntries,
    defaultAddressId,
    listingId,
    prefilledLocation,
    selectedAddressId,
  ]);

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

  const amenityIdsValue = watch("amenityIds");
  useEffect(() => {
    if (!amenityIdsValue.length) return;
    if (!amenities.length) return;
    const ids = new Set(amenities.map((a) => a.id));
    const nameToId = new Map(amenities.map((a) => [a.name, a.id] as const));
    const resolved = amenityIdsValue
      .map((value) => (ids.has(value) ? value : (nameToId.get(value) ?? value)))
      .filter((v) => ids.has(v));
    const dedup = Array.from(new Set(resolved));
    const sameLength = dedup.length === amenityIdsValue.length;
    const sameValues =
      sameLength && dedup.every((v, idx) => v === amenityIdsValue[idx]);
    if (!sameValues) setValue("amenityIds", dedup, { shouldDirty: true });
  }, [amenities, amenityIdsValue, setValue]);

  useEffect(() => {
    if (listingId) return;
    void profileService.getCurrentProfile().then((p) => {
      const phone = (p?.phone ?? "").trim();
      if (phone) setValue("landlordPhone", phone, { shouldDirty: false });
    });
  }, [listingId, setValue]);

  const groupedAmenities = useMemo(() => {
    const categories = amenityCategories
      .slice()
      .sort(
        (a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0),
      );

    const byCategory: Record<string, MasterAmenity[]> = {};
    for (const amenity of amenities) {
      const key = amenity.category_id ?? "uncategorized";
      (byCategory[key] ||= []).push(amenity);
    }

    return categories.map((cat) => ({
      ...cat,
      amenities: (byCategory[cat.id] ?? [])
        .slice()
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    }));
  }, [amenities, amenityCategories]);

  useEffect(() => {
    if (!listingId) return;

    const run = async () => {
      const cached = getCachedListing(listingId);
      if (cached) {
        setPrefillDetails(cached);
        setExistingPhotoUrls((cached.photo_urls as string[]) ?? []);
        await reset({
          categoryId: (cached.property_category_id as string) ?? "",
          subcategoryId: (cached.subcategory_id as string) ?? "",
          propertyTitle: (cached.property_title as string) ?? "",
          description: (cached.description as string) ?? "",
          price: String(cached.price ?? ""),
          isNegotiable: (cached.is_negotiable as boolean) ?? true,
          totalFloor:
            cached.total_floor != null ? String(cached.total_floor) : "",
          propertyFloorNo:
            cached.property_floor_no != null
              ? String(cached.property_floor_no)
              : "",
          totalAreaSqft:
            cached.total_area_sqft != null
              ? String(cached.total_area_sqft)
              : "",
          carpetAreaSqft:
            cached.carpet_area_sqft != null
              ? String(cached.carpet_area_sqft)
              : "",
          landlordPhone: (cached.landlord_phone as string) ?? "",
          amenityIds: (cached.amenity_tags as string[]) ?? [],
        });
        const rawLat = cached.latitude;
        const rawLng = cached.longitude;
        const latitude = typeof rawLat === "number" ? rawLat : Number(rawLat);
        const longitude = typeof rawLng === "number" ? rawLng : Number(rawLng);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setPrefilledLocation({
            label: (cached.location_text as string) ?? "Selected location",
            latitude,
            longitude,
          });
        }
        setIsPrefilling(false);
        return;
      }

      try {
        setIsPrefilling(true);
        const details = await manageService.getMyAdDetails(listingId);
        setPrefillDetails(details);
        setExistingPhotoUrls(details.photo_urls ?? []);
        await reset({
          categoryId: details.property_category_id ?? "",
          subcategoryId: details.subcategory_id ?? "",
          propertyTitle: details.property_title ?? "",
          description: details.description ?? "",
          price: String(details.price ?? ""),
          isNegotiable: details.is_negotiable ?? true,
          totalFloor:
            details.total_floor != null ? String(details.total_floor) : "",
          propertyFloorNo:
            details.property_floor_no != null
              ? String(details.property_floor_no)
              : "",
          totalAreaSqft:
            details.total_area_sqft != null
              ? String(details.total_area_sqft)
              : "",
          carpetAreaSqft:
            details.carpet_area_sqft != null
              ? String(details.carpet_area_sqft)
              : "",
          landlordPhone: details.landlord_phone ?? "",
          amenityIds: details.amenity_tags ?? [],
        });
        const rawLat = (details as { latitude?: number | string | null })
          .latitude;
        const rawLng = (details as { longitude?: number | string | null })
          .longitude;
        const latitude = typeof rawLat === "number" ? rawLat : Number(rawLat);
        const longitude = typeof rawLng === "number" ? rawLng : Number(rawLng);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setPrefilledLocation({
            label: details.location_text ?? "Selected location",
            latitude,
            longitude,
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load listing details.";
        showToast({
          variant: "error",
          title: t("common.error", "Error"),
          message,
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

    const rawCategoryId = String(prefillDetails.property_category_id ?? "").trim();
    const rawCategoryName = String(prefillDetails.property_category ?? "").trim();
    
    if (rawCategoryId && !watch("categoryId")) {
       setValue("categoryId", rawCategoryId, { shouldDirty: false });
    } else if (rawCategoryName && !watch("categoryId")) {
      const matched =
        rows.find((r) => r.code === rawCategoryName) ||
        rows.find((r) => r.name === rawCategoryName);
      if (matched)
        setValue("categoryId", matched.id, { shouldDirty: false });
    }
  }, [categoriesQuery.data, listingId, prefillDetails, setValue, watch]);

  const lastPrefilledSubcategoryNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (!listingId) return;
    if (!prefillDetails) return;
    if (!subcategories.length) return;
    if (watch("subcategoryId")) return;

    const subId = String(prefillDetails.subcategory_id ?? "").trim();
    const name = String(prefillDetails.subcategory ?? "").trim();

    if (subId) {
        setValue("subcategoryId", subId, { shouldDirty: false });
        return;
    }

    if (!name) return;
    if (lastPrefilledSubcategoryNameRef.current === name) return;
    lastPrefilledSubcategoryNameRef.current = name;
    const matched = subcategories.find((row) => row.name === name);
    if (matched) setValue("subcategoryId", matched.id, { shouldDirty: false });
  }, [listingId, prefillDetails, setValue, subcategories, watch]);

  const categoryLabel = tPropertyCategory(
    selectedCategory?.code ?? selectedCategory?.name ?? "Room",
  );
  const toggleAmenity = (amenityId: string) => {
    const next = new Set(watch("amenityIds"));
    if (next.has(amenityId)) next.delete(amenityId);
    else next.add(amenityId);
    setValue("amenityIds", Array.from(next), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const parsedPrice = Number(values.price);
      const parsedTotalArea = parseOptionalNumber(values.totalAreaSqft);
      const parsedCarpetArea = parseOptionalNumber(values.carpetAreaSqft);
      const parsedTotalFloor = parseOptionalInteger(values.totalFloor);
      const parsedPropertyFloor = parseOptionalInteger(values.propertyFloorNo);
      const locationText = selectedLocation?.label?.trim() || "";
      let resolvedLocationIds: {
        state_id: string | null;
        district_id: string | null;
        municipality_id: string | null;
        ward_id: string | null;
      } = {
        state_id: null,
        district_id: null,
        municipality_id: null,
        ward_id: null,
      };

      if (
        selectedLocation?.latitude != null &&
        selectedLocation?.longitude != null
      ) {
        try {
          const adminAtPoint = await lookupNepalAdminAtPoint(
            selectedLocation.latitude,
            selectedLocation.longitude,
          );
          resolvedLocationIds = {
            state_id: adminAtPoint.state?.id ?? null,
            district_id: adminAtPoint.district?.id ?? null,
            municipality_id: adminAtPoint.municipality?.id ?? null,
            ward_id: adminAtPoint.ward?.id ?? null,
          };
        } catch {
          // Keep null IDs if lookup fails; location text/coords still submitted.
        }
      }

      const uploadUrls: string[] = [];
      for (const file of selectedFiles) {
        uploadUrls.push(
          (
            await uploadToR2({
            file,
            folder: "listing-media",
          })
          ).publicUrl,
        );
      }

      const photo_urls = [...existingPhotoUrls, ...uploadUrls].slice(0, 10);

      const landlord_phone = normalizeNepalMobile(values.landlordPhone);
      if (!landlord_phone) {
        showToast({
          variant: "error",
          title: t("common.error", "Error"),
          message: t("landlord.create.validation.phone_invalid"),
        });
        return;
      }

      await manageService.upsertListing({
        listingId,
        property_category: categoryLabel,
        category_id: values.categoryId,
        subcategory: selectedSubcategory?.name ?? null,
        subcategory_id: values.subcategoryId,
        property_title: values.propertyTitle.trim(),
        description: values.description.trim(),
        price: parsedPrice,
        is_negotiable: values.isNegotiable,
        total_area_sqft: parsedTotalArea,
        carpet_area_sqft: parsedCarpetArea,
        total_floor: parsedTotalFloor,
        property_floor_no: parsedPropertyFloor,
        state_id: resolvedLocationIds.state_id,
        district_id: resolvedLocationIds.district_id,
        municipality_id: resolvedLocationIds.municipality_id,
        ward_id: resolvedLocationIds.ward_id,
        location_text: locationText,
        latitude: selectedLocation?.latitude ?? null,
        longitude: selectedLocation?.longitude ?? null,
        landlord_phone,
        thumbnail_url: photo_urls[0] ?? null,
        photo_urls,
        amenity_tags: values.amenityIds,
      });

      showToast({
        variant: "success",
        title: listingId
          ? t("landlord.create.save_changes")
          : t("landlord.create.submit_for_review"),
        message: listingId
          ? "Your listing changes have been saved."
          : "Your listing has been sent for moderation.",
      });

      router.replace("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Submission failed.";
      showToast({
        variant: "error",
        title: t("common.error", "Error"),
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const formOk = await trigger([
        "categoryId",
        "subcategoryId",
        "propertyTitle",
        "description",
        "price",
        "landlordPhone",
        "totalFloor",
        "propertyFloorNo",
        "totalAreaSqft",
        "carpetAreaSqft",
      ]);
      setLocationTouched(true);
      const hasLocation = Boolean(selectedLocation);
      const ok = formOk && hasLocation;
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
    <div className="mx-auto min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-90px)] w-full max-w-3xl px-4 py-6">
      {isPrefilling || categoriesQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-bg-page p-6 text-center text-text-secondary">
          {t("landlord.create.loading_listing")}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 text-sm text-text-tertiary">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-bg-input hover:text-text-primary transition"
              aria-label={t("common.back", "Back")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {t("landlord.create.step_of", {
              current: currentStep,
              total: totalSteps,
            })}
          </div>

          {currentStep === 1 ? (
            <div className="space-y-5 rounded-2xl border border-border bg-bg-page/40 p-5">
              <div className="text-base font-semibold text-text-primary">
                {t("landlord.create.basic_details")}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.category")}
                </label>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{
                    required: t("landlord.create.validation.category_required"),
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setValue("subcategoryId", "", {
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={
                          lockCategory ||
                          categoriesQuery.isLoading ||
                          !(categoriesQuery.data ?? []).length
                        }
                        className={cn(
                          fieldState.error
                            ? "border-destructive"
                            : "border-border",
                        )}
                      >
                        <option value="" disabled>
                          {t("explore.select_category", "Select category")}
                        </option>
                        {(categoriesQuery.data ?? []).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {tPropertyCategory(cat.code ?? cat.name)}
                          </option>
                        ))}
                      </Select>
                      {fieldState.error?.message ? (
                        <div className="mt-2 text-xs text-destructive">
                          {String(fieldState.error.message)}
                        </div>
                      ) : null}
                    </>
                  )}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.subcategory")}
                </label>
                <Controller
                  name="subcategoryId"
                  control={control}
                  rules={{
                    required: t("landlord.create.validation.subcategory_required"),
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        {...field}
                        disabled={!subcategories.length}
                        className={cn(
                          fieldState.error
                            ? "border-destructive"
                            : "border-border",
                        )}
                      >
                        <option value="" disabled>
                          {subcategories.length
                            ? t("landlord.create.select_subcategory")
                            : t("landlord.create.no_subcategories")}
                        </option>
                        {subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {tPropertySubcategory(sub.code ?? sub.name)}
                          </option>
                        ))}
                      </Select>
                      {fieldState.error?.message ? (
                        <div className="mt-2 text-xs text-destructive">
                          {String(fieldState.error.message)}
                        </div>
                      ) : null}
                    </>
                  )}
                />
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
                  className={
                    touchedFields.propertyTitle && errors.propertyTitle
                      ? "border-destructive"
                      : undefined
                  }
                />
                {touchedFields.propertyTitle &&
                errors.propertyTitle?.message ? (
                  <div className="mt-2 text-xs text-destructive">
                    {String(errors.propertyTitle.message)}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.description")}
                </label>
                <textarea
                  {...register("description", {
                    required: t(
                      "landlord.create.validation.description_required",
                    ),
                    onBlur: () => trigger("description"),
                  })}
                  placeholder={t("landlord.create.placeholder.description")}
                  className={cn(
                    "min-h-28 w-full resize-y rounded-2xl border bg-bg-input px-4 py-3 text-sm text-text-primary outline-none placeholder:text-placeholder focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
                    touchedFields.description && errors.description
                      ? "border-destructive"
                      : "border-border",
                  )}
                />
                {touchedFields.description && errors.description?.message ? (
                  <div className="mt-2 text-xs text-destructive">
                    {String(errors.description.message)}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.price_label", {
                    currency: tCurrency("NPR"),
                  })}
                </label>
                <Input
                  {...register("price", {
                    required: t("landlord.create.validation.price_required"),
                    validate: (value) => {
                      const v = String(value ?? "").trim();
                      if (!v)
                        return t("landlord.create.validation.price_required");
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0)
                        return t("landlord.create.validation.valid_price");
                      return true;
                    },
                    onBlur: () => trigger("price"),
                  })}
                  inputMode="numeric"
                  placeholder={t("landlord.create.placeholder.price_label")}
                  className={
                    touchedFields.price && errors.price
                      ? "border-destructive"
                      : undefined
                  }
                />
                {touchedFields.price && errors.price?.message ? (
                  <div className="mt-2 text-xs text-destructive">
                    {String(errors.price.message)}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    {...register("isNegotiable")}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="font-semibold">
                    {t("landlord.create.negotiable")}
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.landlord_phone")}
                </label>
                <Input
                  {...register("landlordPhone", {
                    required: t("landlord.create.validation.phone_required"),
                    validate: (value) =>
                      normalizeNepalMobile(String(value ?? ""))
                        ? true
                        : t("landlord.create.validation.phone_invalid"),
                    onBlur: () => trigger("landlordPhone"),
                  })}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("landlord.create.placeholder.landlord_phone")}
                  className={
                    touchedFields.landlordPhone && errors.landlordPhone
                      ? "border-destructive"
                      : undefined
                  }
                />
                <p className="mt-1.5 text-xs text-text-tertiary">
                  {t("landlord.create.landlord_phone_help")}
                </p>
                {touchedFields.landlordPhone &&
                errors.landlordPhone?.message ? (
                  <div className="mt-2 text-xs text-destructive">
                    {String(errors.landlordPhone.message)}
                  </div>
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
                        const parsed = parseOptionalInteger(
                          String(value ?? ""),
                        );
                        if (Number.isNaN(parsed) || (parsed as number) < 0)
                          return t(
                            "landlord.create.validation.valid_total_floor",
                          );
                        return true;
                      },
                      onBlur: () => trigger(["totalFloor", "propertyFloorNo"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.total_floor")}
                    className={
                      touchedFields.totalFloor && errors.totalFloor
                        ? "border-destructive"
                        : undefined
                    }
                  />
                  {touchedFields.totalFloor && errors.totalFloor?.message ? (
                    <div className="mt-2 text-xs text-destructive">
                      {String(errors.totalFloor.message)}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.property_floor")}
                  </label>
                  <Input
                    {...register("propertyFloorNo", {
                      validate: (value) => {
                        const parsedPropertyFloor = parseOptionalInteger(
                          String(value ?? ""),
                        );
                        if (
                          Number.isNaN(parsedPropertyFloor) ||
                          (parsedPropertyFloor as number) < 0
                        ) {
                          return t(
                            "landlord.create.validation.valid_property_floor",
                          );
                        }
                        const parsedTotalFloor = parseOptionalInteger(
                          String(watch("totalFloor") ?? ""),
                        );
                        if (
                          parsedPropertyFloor != null &&
                          parsedTotalFloor != null &&
                          !Number.isNaN(parsedTotalFloor) &&
                          (parsedPropertyFloor as number) >
                            (parsedTotalFloor as number)
                        ) {
                          return t(
                            "landlord.create.validation.valid_property_floor_v2",
                          );
                        }
                        return true;
                      },
                      onBlur: () => trigger(["propertyFloorNo", "totalFloor"]),
                    })}
                    inputMode="numeric"
                    placeholder={t(
                      "landlord.create.placeholder.property_floor",
                    )}
                    className={
                      touchedFields.propertyFloorNo && errors.propertyFloorNo
                        ? "border-destructive"
                        : undefined
                    }
                  />
                  {touchedFields.propertyFloorNo &&
                  errors.propertyFloorNo?.message ? (
                    <div className="mt-2 text-xs text-destructive">
                      {String(errors.propertyFloorNo.message)}
                    </div>
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
                        if (Number.isNaN(parsed) || (parsed as number) < 0)
                          return t(
                            "landlord.create.validation.valid_total_area",
                          );
                        return true;
                      },
                      onBlur: () =>
                        trigger(["totalAreaSqft", "carpetAreaSqft"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.total_area")}
                    className={
                      touchedFields.totalAreaSqft && errors.totalAreaSqft
                        ? "border-destructive"
                        : undefined
                    }
                  />
                  {touchedFields.totalAreaSqft &&
                  errors.totalAreaSqft?.message ? (
                    <div className="mt-2 text-xs text-destructive">
                      {String(errors.totalAreaSqft.message)}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    {t("landlord.create.carpet_area")}
                  </label>
                  <Input
                    {...register("carpetAreaSqft", {
                      validate: (value) => {
                        const parsedCarpetArea = parseOptionalNumber(
                          String(value ?? ""),
                        );
                        if (
                          Number.isNaN(parsedCarpetArea) ||
                          (parsedCarpetArea as number) < 0
                        ) {
                          return t(
                            "landlord.create.validation.valid_carpet_area",
                          );
                        }
                        const parsedTotalArea = parseOptionalNumber(
                          String(watch("totalAreaSqft") ?? ""),
                        );
                        if (
                          parsedCarpetArea != null &&
                          parsedTotalArea != null &&
                          !Number.isNaN(parsedTotalArea) &&
                          (parsedCarpetArea as number) >
                            (parsedTotalArea as number)
                        ) {
                          return t(
                            "landlord.create.validation.valid_carpet_area_v2",
                          );
                        }
                        return true;
                      },
                      onBlur: () =>
                        trigger(["carpetAreaSqft", "totalAreaSqft"]),
                    })}
                    inputMode="numeric"
                    placeholder={t("landlord.create.placeholder.carpet_area")}
                    className={
                      touchedFields.carpetAreaSqft && errors.carpetAreaSqft
                        ? "border-destructive"
                        : undefined
                    }
                  />
                  {touchedFields.carpetAreaSqft &&
                  errors.carpetAreaSqft?.message ? (
                    <div className="mt-2 text-xs text-destructive">
                      {String(errors.carpetAreaSqft.message)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-secondary">
                  {t("landlord.create.selected_address")}
                </label>
                <div
                  className={cn(
                    "rounded-2xl border bg-bg-input px-4 py-3",
                    locationError ? "border-destructive" : "border-border",
                  )}
                >
                  {selectedLocation ? (
                    <>
                      <div className="text-sm font-semibold text-text-primary">
                        {selectedLocation.label}
                      </div>
                      <div className="mt-0.5 text-xs text-text-tertiary">
                        {selectedLocation.latitude.toFixed(5)},{" "}
                        {selectedLocation.longitude.toFixed(5)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-text-tertiary">
                      {addressEntries.length > 0
                        ? t("landlord.create.select_address_to_continue")
                        : t("landlord.create.add_address_to_continue")}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (!addressEntries.length) {
                        router.push("/addresses/pick");
                        return;
                      }
                      const fallbackId =
                        selectedAddressId ??
                        defaultAddressId ??
                        addressEntries[0]?.id ??
                        null;
                      if (fallbackId) {
                        setSelectedAddressId(fallbackId);
                        setPrefilledLocation(null);
                        setLocationTouched(false);
                      }
                    }}
                  >
                    {addressEntries.length === 0
                      ? t("landlord.create.add_address_btn")
                      : t("landlord.create.change_address_btn")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/addresses")}
                  >
                    {t("landlord.create.manage_btn")}
                  </Button>
                </div>

                {addressEntries.length > 0 ? (
                  <div className="space-y-2 rounded-2xl border border-border bg-bg-input p-3">
                    {addressEntries.map((entry) => {
                      const active = entry.id === selectedAddressId;
                      const isDefault = entry.id === defaultAddressId;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={cn(
                            "block w-full rounded-xl border px-3 py-2 text-left",
                            active
                              ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                              : "border-border bg-bg-card",
                          )}
                          onClick={() => {
                            setPrefilledLocation(null);
                            setSelectedAddressId(entry.id);
                            setLocationTouched(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-text-primary">
                              {entry.label}
                            </div>
                            {isDefault ? (
                              <span className="rounded bg-primary-500/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                {t("landlord.create.default_badge")}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-text-tertiary">
                            {entry.latitude != null && entry.longitude != null
                              ? `${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}`
                              : "--"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {locationError ? (
                  <div className="text-xs text-destructive">
                    {locationError}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6 rounded-2xl border border-border bg-bg-page/40 p-5">
              <div>
                <div className="text-base font-semibold text-text-primary">
                  {t("listing_amenities.title")}
                </div>
                <div className="mt-1 text-sm text-text-tertiary">
                  {t("listing_amenities.subtitle")}
                </div>
              </div>

              {amenityCategoriesQuery.isLoading || amenitiesQuery.isLoading ? (
                <div className="text-sm text-text-tertiary">
                  {t("listing_amenities.loading")}
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedAmenities.map(
                    (
                      group: MasterAmenityCategory & {
                        amenities: MasterAmenity[];
                      },
                    ) => (
                      <div key={group.id} className="space-y-3">
                        <div className="text-sm font-semibold text-text-secondary">
                          {tAmenityCategory(group.code ?? group.name)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.amenities.map((amenity) => {
                            const active = (watch("amenityIds") ?? []).includes(
                              amenity.id,
                            );
                            return (
                              <button
                                key={amenity.id}
                                type="button"
                                onClick={() => toggleAmenity(amenity.id)}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                                  active
                                    ? "border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200"
                                    : "border-border bg-bg-input text-text-secondary hover:border-primary-200 hover:text-text-primary",
                                )}
                              >
                                {tAmenity(amenity.code || amenity.name)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5 rounded-2xl border border-border bg-bg-page/40 p-5">
              <div>
                <div className="text-base font-semibold text-text-primary">
                  {t("listing_media.title", "Add Photos")}
                </div>
                {/* <div className="mt-1 text-sm text-text-tertiary">
                  {t(
                    "listing_media.subtitle",
                    "Upload visually appealing photos. You can add up to 10 photos.",
                  )}
                </div> */}
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
                    setSelectedFiles((prev) =>
                      [...prev, ...files].slice(0, 10),
                    );
                    e.target.value = "";
                  }}
                  className="border border-primary-400 p-4 pr-0 rounded-full "
                />
                <div className="text-xs text-text-tertiary">
                  {t(
                    "listing_media.tip_cover",
                    "Tip: the first image becomes the cover photo.",
                  )}
                </div>
              </div>

              {existingPhotoUrls.length || selectedFiles.length ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-text-secondary">
                    {t("listing_media.selected", "Selected")} (
                    {Math.min(
                      existingPhotoUrls.length + selectedFiles.length,
                      10,
                    )}
                    )
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {existingPhotoUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="relative overflow-hidden rounded-2xl border border-border bg-bg-input"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExistingPhotoUrls((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                        >
                          {t("common.remove", "Remove")}
                        </button>
                      </div>
                    ))}
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="relative overflow-hidden rounded-2xl border border-border bg-bg-input"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
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

          <div className="mt-5 flex  items-center sm:justify-end">
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isPrefilling}
              className="flex-1 sm:flex-0 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
            >
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
