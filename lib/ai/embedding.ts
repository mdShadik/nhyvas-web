const CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";

/**
 * Generates an embedding vector for the given text using Cloudflare Workers AI via REST API.
 * Output dimension: 384
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.toLowerCase().replace(/\s+/g, " ").trim();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: normalizedText,
        // pooling: "mean" is handled natively by the model
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const data = result.result?.data;
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Cloudflare Workers AI returned an empty embedding response.");
  }

  const first = data[0];
  return Array.isArray(first) ? first : data;
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
