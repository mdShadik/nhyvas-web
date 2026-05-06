import i18n from "@/i18n";

const PROPERTY_CATEGORY_NAME_TO_CODE: Record<string, string> = {
  "Flat/Apartment": "FLAT_APARTMENT",
  Room: "ROOM",
  "Villa/House": "VILLA_HOUSE",
  "Land/Plot": "LAND_PLOT",
  Commercial: "COMMERCIAL",
};

const PROPERTY_SUBCATEGORY_NAME_TO_CODE: Record<string, string> = {
  Studio: "STUDIO",
  "1 BHK": "1_BHK",
  "2 BHK": "2_BHK",
  "3 BHK": "3_BHK",
  "4+ BHK": "4PLUS_BHK",
  Penthouse: "PENTHOUSE",
  "Duplex Apartment": "DUPLEX_APARTMENT",
  "1 RK": "1_RK",
  "2 RK": "2_RK",
  "Private Room": "PRIVATE_ROOM",
  "Shared Room": "SHARED_ROOM",
  "Hostel/PG Room": "HOSTEL_ROOM",
  Bungalow: "BUNGALOW",
  "Row House": "ROW_HOUSE",
  "Detached House": "DETACHED_HOUSE",
  Villa: "VILLA",
  "Duplex House": "DUPLEX_HOUSE",
  "Residential Plot": "RESIDENTIAL_PLOT",
  "Commercial Plot": "COMMERCIAL_PLOT",
  "Agricultural Land": "AGRICULTURAL_LAND",
  "Shop/Shutter": "SHOP_SHUTTER",
  "Office Space": "OFFICE_SPACE",
  Warehouse: "WAREHOUSE",
};

const AMENITY_NAME_TO_CODE: Record<string, string> = {
  "24/7 Water": "WATER_24_7",
  "No Load-shedding (Inverter/Generator)": "NO_LOAD_SHEDDING",
  "No Load-shedding": "NO_LOAD_SHEDDING",
  "Solar Water Heater": "SOLAR_WATER_HEATER",
  "Garbage Collection": "GARBAGE_COLLECTION",
  "Attached Bathroom": "ATTACHED_BATHROOM",
  Balcony: "BALCONY",
  "Modular Kitchen": "ATTACHED_KITCHEN",
  Wardrobe: "WARDROBE",
  WiFi: "WIFI",
  "Bathroom Geyser": "BATHROOM_GEYSER",
  "Air Conditioner": "AIR_CONDITIONER",
  "Parking (2-wheeler/4-wheeler)": "PARKING",
  Parking: "PARKING",
  "CCTV Security": "CCTV_SECURITY",
  "Lift/Elevator": "LIFT_ELEVATOR",
  "Terrace Access": "TERRACE_ACCESS",
  Gym: "GYM",
  Pool: "POOL",
  Laundry: "LAUNDRY",
  "Pet Friendly": "PET_FRIENDLY",
  "Couple Friendly": "COUPLE_FRIENDLY",
  "No Smoking": "NO_SMOKING",
  "24/7 Access (No gate locking time)": "ACCESS_24_7",
  "Non-Veg Allowed": "NON_VEG_ALLOWED",
  "Non-Veg Not Allowed": "NON_VEG_NOT_ALLOWED",
};

const DYNAMIC_PROPERTY_CATEGORY_NAME_TO_CODE: Record<string, string> = {};
const DYNAMIC_PROPERTY_SUBCATEGORY_NAME_TO_CODE: Record<string, string> = {};
const DYNAMIC_AMENITY_NAME_TO_CODE: Record<string, string> = {};

function looksLikeCode(value: string) {
  return /^[A-Z0-9_]+$/.test(value.trim());
}

function translateMasterData(path: string, code: string, fallback: string) {
  // Master-data translations are sourced from backend translation tables.
  // We standardize on lowercased codes in DB (admin convention).
  const normalizedCode = code.trim().toLowerCase();
  const key = `${path}.${normalizedCode}`;
  return i18n.t(key, { defaultValue: fallback });
}

export function registerMasterPropertyCategories(rows: Array<{ name?: string | null; code?: string | null }>) {
  for (const row of rows) {
    const name = (row.name ?? "").trim();
    const code = (row.code ?? "").trim();
    if (!name || !code) continue;
    DYNAMIC_PROPERTY_CATEGORY_NAME_TO_CODE[name] = code;
  }
}

export function registerMasterPropertySubcategories(rows: Array<{ name?: string | null; code?: string | null }>) {
  for (const row of rows) {
    const name = (row.name ?? "").trim();
    const code = (row.code ?? "").trim();
    if (!name || !code) continue;
    DYNAMIC_PROPERTY_SUBCATEGORY_NAME_TO_CODE[name] = code;
  }
}

export function registerMasterAmenities(rows: Array<{ name?: string | null; code?: string | null }>) {
  for (const row of rows) {
    const name = (row.name ?? "").trim();
    const code = (row.code ?? "").trim();
    if (!name || !code) continue;
    DYNAMIC_AMENITY_NAME_TO_CODE[name] = code;
  }
}

export function tPropertyCategory(name: string): string {
  const normalized = name.trim();
  const code =
    looksLikeCode(normalized)
      ? normalized
      : DYNAMIC_PROPERTY_CATEGORY_NAME_TO_CODE[normalized] ??
        PROPERTY_CATEGORY_NAME_TO_CODE[normalized] ??
        normalized;

  return translateMasterData("master_data.property_categories", code, normalized);
}

export function tPropertyCategoryDescription(codeOrName: string, fallback: string): string {
  const normalized = codeOrName.trim();
  const code =
    looksLikeCode(normalized)
      ? normalized
      : DYNAMIC_PROPERTY_CATEGORY_NAME_TO_CODE[normalized] ??
        PROPERTY_CATEGORY_NAME_TO_CODE[normalized] ??
        normalized;

  return translateMasterData("master_data.property_category_descriptions", code, fallback);
}

export function tPropertySubcategory(name: string): string {
  const normalized = name.trim();
  const code =
    looksLikeCode(normalized)
      ? normalized
      : DYNAMIC_PROPERTY_SUBCATEGORY_NAME_TO_CODE[normalized] ??
        PROPERTY_SUBCATEGORY_NAME_TO_CODE[normalized] ??
        normalized;

  return translateMasterData("master_data.property_subcategories", code, normalized);
}

export function tAmenity(name: string): string {
  const normalized = name.trim();
  const code =
    looksLikeCode(normalized)
      ? normalized
      : DYNAMIC_AMENITY_NAME_TO_CODE[normalized] ??
        AMENITY_NAME_TO_CODE[normalized] ??
        normalized;

  return translateMasterData("master_data.amenities", code, normalized);
}

export function tAmenityCategory(codeOrName: string): string {
  const normalized = codeOrName.trim();
  return translateMasterData("master_data.amenity_categories", normalized, normalized);
}

export function tPriceRangeLabel(configKey: string, fallback: string): string {
  return translateMasterData("master_data.price_ranges", configKey.trim(), fallback);
}

export function tCurrency(code: string): string {
  const normalized = (code ?? "").trim().toUpperCase();
  if (normalized === "NPR") {
    return i18n.t("currency.npr", { defaultValue: code });
  }
  return normalized || code;
}
