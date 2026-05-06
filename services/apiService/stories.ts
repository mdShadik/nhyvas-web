import { requestJson } from "@/services/apiService/http";

export type PropertyStoryFeedRow = {
  story_id: string;
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

export const storiesService = {
  async getFeed(): Promise<PropertyStoryFeedRow[]> {
    const { rows } = await requestJson<{ rows: PropertyStoryFeedRow[] }>("/api/stories/feed", { method: "POST" });
    return rows ?? [];
  },

  async getActiveStoryForProperty(propertyId: string): Promise<PropertyStoryFeedRow | null> {
    const { row } = await requestJson<{ row: PropertyStoryFeedRow | null }>("/api/stories/active-for-property", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    });
    return row ?? null;
  },

  async upsertStory(p: { propertyId: string; mediaUrl: string; thumbnailUrl: string | null }): Promise<string> {
    const { id } = await requestJson<{ id: string }>("/api/stories/upsert", {
      method: "POST",
      body: JSON.stringify(p),
    });
    return id;
  },
};
