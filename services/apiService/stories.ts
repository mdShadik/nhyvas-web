import { requestJson } from "@/services/apiService/http";

export type PropertyStoryFeedRow = {
  story_id: string;
  /**
   * Some backends return `id` instead of `story_id`. We normalize to `story_id`
   * in the service layer, but keep this optional for type safety.
   */
  id?: string;
  landlord_id: string;
  property_id: string;
  media_url: string;
  thumbnail_url: string | null;
  expires_at: string;
  landlord_name: string;
  landlord_avatar: string | null;
  property_title: string;
  created_at: string;
};

export type StoryGroup = {
  landlordId: string;
  landlordName: string;
  landlordAvatar: string | null;
  stories: PropertyStoryFeedRow[];
};

export function groupStoryFeed(rows: PropertyStoryFeedRow[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const row of rows) {
    let g = map.get(row.landlord_id);
    if (!g) {
      g = {
        landlordId: row.landlord_id,
        landlordName: row.landlord_name,
        landlordAvatar: row.landlord_avatar,
        stories: [],
      };
      map.set(row.landlord_id, g);
    }
    g.stories.push(row);
  }
  return Array.from(map.values());
}

function normalizeStoryRow(row: unknown): PropertyStoryFeedRow {
  const r = (row && typeof row === "object" ? (row as Record<string, unknown>) : {}) as Record<string, unknown>;
  const storyId =
    typeof r.story_id === "string" && r.story_id
      ? r.story_id
      : typeof r.id === "string" && r.id
        ? r.id
        : "";

  return {
    story_id: storyId,
    landlord_id: typeof r.landlord_id === "string" ? r.landlord_id : "",
    property_id: typeof r.property_id === "string" ? r.property_id : "",
    media_url: typeof r.media_url === "string" ? r.media_url : "",
    thumbnail_url: typeof r.thumbnail_url === "string" ? r.thumbnail_url : null,
    expires_at: typeof r.expires_at === "string" ? r.expires_at : "",
    landlord_name: typeof r.landlord_name === "string" ? r.landlord_name : "",
    landlord_avatar: typeof r.landlord_avatar === "string" ? r.landlord_avatar : null,
    property_title: typeof r.property_title === "string" ? r.property_title : "",
    created_at: typeof r.created_at === "string" ? r.created_at : "",
  };
}

export const storiesService = {
  async getFeed(): Promise<PropertyStoryFeedRow[]> {
    const { rows } = await requestJson<{ rows: PropertyStoryFeedRow[] }>("/api/stories/feed", { method: "POST" });
    return rows ?? [];
  },

  async getRecommendedStories(params: {
    userLat?: number | null;
    userLng?: number | null;
    userRadiusKm?: number | null;
    limit?: number;
    offset?: number;
  }): Promise<PropertyStoryFeedRow[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/stories/recommended", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return (rows ?? []).map(normalizeStoryRow).filter((r) => Boolean(r.story_id));
  },

  async getActiveStoriesForProperty(propertyId: string): Promise<PropertyStoryFeedRow[]> {
    const res = await requestJson<unknown>("/api/stories/active-for-property", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    });
    const rawRows = Array.isArray(res)
      ? res
      : res && typeof res === "object" && Array.isArray((res as Record<string, unknown>).rows)
        ? ((res as Record<string, unknown>).rows as unknown[])
        : null;
    if (!Array.isArray(rawRows)) return [];
    return rawRows.map(normalizeStoryRow).filter((r) => Boolean(r.story_id));
  },

  async upsertStory(p: { propertyId: string; mediaUrl: string; thumbnailUrl: string | null }): Promise<string> {
    const { id } = await requestJson<{ id: string }>("/api/stories/upsert", {
      method: "POST",
      body: JSON.stringify(p),
    });
    return id;
  },
};
