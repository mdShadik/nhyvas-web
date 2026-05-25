import { getTransformers } from "./transformers-config";

class EmbeddingModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: any = null;
  private static modelName = "Supabase/gte-small";

  static async getInstance() {
    if (!this.instance) {
      const { pipeline } = await getTransformers();
      this.instance = await pipeline("feature-extraction", this.modelName);
    }
    return this.instance;
  }
}

/**
 * Generates a normalized embedding vector for the given text using gte-small.
 * Output dimension: 384
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await EmbeddingModel.getInstance();
  
  // Normalize text: lowercase and remove extra whitespace
  const normalizedText = text.toLowerCase().replace(/\s+/g, " ").trim();
  
  const output = await extractor(normalizedText, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Combines property fields into a single searchable text blob for embedding.
 */
export function buildSearchablePropertyText(property: {
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  location_text: string;
  amenity_tags?: string[];
}) {
  const parts = [
    property.title,
    property.description,
    property.category,
    property.subcategory || "",
    property.location_text,
    ...(property.amenity_tags || []),
  ];
  
  return parts.filter(Boolean).join(" ").toLowerCase();
}
