import { getCloudflareContext } from "@opennextjs/cloudflare";

const CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";

type CloudflareEmbeddingResponse = {
  data?: number[] | number[][];
};

type CloudflareAiBinding = {
  run(model: string, input: { text: string; pooling?: "mean" | "cls" }): Promise<CloudflareEmbeddingResponse>;
};

function readEmbedding(response: CloudflareEmbeddingResponse): number[] {
  const data = response.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Cloudflare Workers AI returned an empty embedding response.");
  }

  const first = data[0];
  if (Array.isArray(first)) return first;
  return data as number[];
}

/**
 * Generates an embedding vector for the given text using Cloudflare Workers AI.
 * Output dimension: 384
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Normalize text: lowercase and remove extra whitespace
  const normalizedText = text.toLowerCase().replace(/\s+/g, " ").trim();

  const ai = (getCloudflareContext().env as any).AI as CloudflareAiBinding | undefined;
  if (!ai) {
    throw new Error("Cloudflare Workers AI binding `AI` is not configured.");
  }

  const output = await ai.run(CLOUDFLARE_EMBEDDING_MODEL, {
    text: normalizedText,
    pooling: "mean",
  });

  return readEmbedding(output);
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