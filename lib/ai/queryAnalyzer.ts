export interface AnalyzedSubcategory {
  category_id: string;
  subCategory_id: string;
}

export interface AnalyzedQuery {
  originalQuery: string;
  semanticQuery: string;
  keywordQuery: string;
  intent: "rent" | "buy" | "sell" | string;
  propertyType: string[];
  subcategories: AnalyzedSubcategory[];
  budget: { min: number | null; max: number | null };
  features: string[];
  lifestyleTags: string[];
  vibeTags: string[];
  nearMe: boolean;
  location?: string;
  isWardSearch: boolean;
  wardNumber?: number;
  city?: string;
  recommendationMode: boolean;
}

export interface AiMapping {
  map_type: "category" | "subcategory" | "amenity" | "location" | "vibe" | "lifestyle";
  keyword: string;
  mapped_id: string | null;
  mapped_value: string | null;
  mapped_parent_id: string | null;
}


const STOP_WORDS = ["at", "in", "near", "with", "a", "an", "the", "for", "to", "of", "and"];

export function analyzeQuery(query: string, dynamicMappings: AiMapping[] = []): AnalyzedQuery {
  const lowerQuery = query.toLowerCase().replace(/[?.,!]/g, " ");
  const words = lowerQuery.split(/\s+/).filter(Boolean);
  
  const analyzed: AnalyzedQuery = {
    originalQuery: query,
    semanticQuery: query,
    keywordQuery: "",
    intent: "rent",
    propertyType: [],
    subcategories: [],
    budget: { min: null, max: null },
    features: [],
    lifestyleTags: [],
    vibeTags: [],
    nearMe: false,
    isWardSearch: false,
    recommendationMode: true,
  };

  // 1. Detect Intent
  if (lowerQuery.includes("buy") || lowerQuery.includes("sale")) analyzed.intent = "buy";
  
  // 2. Dynamic Mapping detection (Categories, Subcategories, Amenities, Vibes, Lifestyle, Locations)
  dynamicMappings.forEach((m) => {
    const regex = new RegExp(`\\b${m.keyword}\\b`, 'i');
    if (regex.test(lowerQuery)) {
      switch (m.map_type) {
        case "category":
          if (m.mapped_id && !analyzed.propertyType.includes(m.mapped_id)) {
            analyzed.propertyType.push(m.mapped_id);
          }
          break;
        case "subcategory":
          if (m.mapped_id && m.mapped_parent_id) {
            const alreadyExists = analyzed.subcategories.some(
              (s) => s.subCategory_id === m.mapped_id
            );
            if (!alreadyExists) {
              analyzed.subcategories.push({
                category_id: m.mapped_parent_id,
                subCategory_id: m.mapped_id,
              });
            }
            if (!analyzed.propertyType.includes(m.mapped_parent_id)) {
              analyzed.propertyType.push(m.mapped_parent_id);
            }
          }
          break;
        case "amenity":
          if (m.mapped_id && !analyzed.features.includes(m.mapped_id)) {
            analyzed.features.push(m.mapped_id);
          }
          break;
        case "vibe":
          if (m.mapped_value) {
            analyzed.vibeTags.push(...m.mapped_value.split(","));
          }
          break;
        case "lifestyle":
          if (m.mapped_value) {
            analyzed.lifestyleTags.push(...m.mapped_value.split(","));
          }
          break;
        case "location":
          if (m.mapped_value) {
            analyzed.location = m.mapped_value;
          }
          break;
      }
    }
  });

  // 3. Detect Budget
  // Max budget
  const maxBudgetMatch = lowerQuery.match(/(?:under|below|less than|max|up to)\s*(?:rs\.?|npr)?\s*(\d+(?:k|m)?)/);
  if (maxBudgetMatch) {
    const val = maxBudgetMatch[1];
    let num = parseInt(val);
    if (val.endsWith("k")) num *= 1000;
    if (val.endsWith("m")) num *= 1000000;
    analyzed.budget.max = num;
  }

  // Min budget
  const minBudgetMatch = lowerQuery.match(/(?:above|more than|at least|min|starting from)\s*(?:rs\.?|npr)?\s*(\d+(?:k|m)?)/);
  if (minBudgetMatch) {
    const val = minBudgetMatch[1];
    let num = parseInt(val);
    if (val.endsWith("k")) num *= 1000;
    if (val.endsWith("m")) num *= 1000000;
    analyzed.budget.min = num;
  }

  // Range budget
  const rangeMatch = lowerQuery.match(/(?:between|from)?\s*(\d+(?:k|m)?)\s*(?:to|-|and)\s*(\d+(?:k|m)?)/);
  if (rangeMatch) {
    const val1 = rangeMatch[1];
    const val2 = rangeMatch[2];
    
    let num1 = parseInt(val1);
    if (val1.endsWith("k")) num1 *= 1000;
    if (val1.endsWith("m")) num1 *= 1000000;
    
    let num2 = parseInt(val2);
    if (val2.endsWith("k")) num2 *= 1000;
    if (val2.endsWith("m")) num2 *= 1000000;
    
    analyzed.budget.min = Math.min(num1, num2);
    analyzed.budget.max = Math.max(num1, num2);
  }

  // 4. Detect Bedrooms/BHK
  const bhkMatch = lowerQuery.match(/(\d+)\s*(?:bhk|bedroom|bed room|room)/);
  let bhkString = "";
  if (bhkMatch) {
    bhkString = `${bhkMatch[1]} bhk`;
  }

  // 5. Detect near me
  if (lowerQuery.includes("near me") || lowerQuery.includes("nearby") || lowerQuery.includes("close to me")) {
    analyzed.nearMe = true;
  }

  // 6. Detect Location & Ward
  const wardMatch = lowerQuery.match(/\bward\b\s*(\d+)/i);
  if (wardMatch) {
    analyzed.isWardSearch = true;
    analyzed.wardNumber = parseInt(wardMatch[1]);
  } else if (/\bward\b/i.test(lowerQuery)) {
    analyzed.isWardSearch = true;
  }

  // 7. Build Keyword Query
  const mappedKeywords = dynamicMappings.map(m => m.keyword);
  const internalMappedWords = [
    ...STOP_WORDS,
    "buy", "sale", "rent", "budget", "price", "between", "under", "above", "more", "less", "than", "to", "and", "rs", "npr", "k", "m", "bhk", "bedroom", "room"
  ];

  const importantWords = words.filter(w => {
    if (/^\d+[km]?$/.test(w)) {
      if (bhkMatch && bhkMatch[1] === w) return true;
      if (wardMatch && wardMatch[1] === w) return false;
      return false;
    }
    if (w === "ward") return false;
    
    return (!mappedKeywords.includes(w) && !internalMappedWords.includes(w));
  });
  
  if (bhkString && !importantWords.includes(bhkMatch![1])) {
    importantWords.push(bhkString);
  }

  analyzed.keywordQuery = importantWords.join(" ");
  if (!analyzed.keywordQuery.trim()) {
    analyzed.keywordQuery = words.filter(w => !STOP_WORDS.includes(w)).join(" ");
  }

  return analyzed;
}
