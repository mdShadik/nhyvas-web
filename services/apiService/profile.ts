import { requestJson } from "@/services/apiService/http";

export type AppProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type UserPreferences = {
  user_id: string;
  min_price: number | null;
  max_price: number | null;
  category_code: string | null;
  preferred_amenities: string[];
};

export type CompleteOnboardingInput = {
  fullName: string;
  email?: string | null;
  avatarUri?: string | null;
};

export const profileService = {
  async getBootstrap(): Promise<{
    profile: AppProfile | null;
    preferences: UserPreferences | null;
  }> {
    const { row } = await requestJson<{ row: any | null }>("/api/profile/bootstrap", { method: "POST" });
    if (!row) {
      return { profile: null, preferences: null };
    }

    const profile: AppProfile = {
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      avatar_url: row.avatar_url ?? null,
      role: row.role ?? null,
    };

    const preferences: UserPreferences = {
      user_id: row.id,
      min_price: row.min_price ?? null,
      max_price: row.max_price ?? null,
      category_code: row.category_code ?? null,
      preferred_amenities: row.preferred_amenities ?? [],
    };

    return { profile, preferences };
  },

  async getCurrentProfile(): Promise<AppProfile | null> {
    const { profile } = await requestJson<{ profile: AppProfile | null }>("/api/profile/current", { method: "POST" });
    return profile ?? null;
  },

  async completeOnboarding(input: CompleteOnboardingInput): Promise<void> {
    const avatarUrl =
      input.avatarUri && (input.avatarUri.startsWith("http://") || input.avatarUri.startsWith("https://"))
        ? input.avatarUri
        : null;
    await requestJson("/api/profile/complete-onboarding", {
      method: "POST",
      body: JSON.stringify({
        fullName: input.fullName,
        email: input.email ?? null,
        avatarUrl,
      }),
    });
  },

  async deleteAccount(): Promise<void> {
    await requestJson("/api/profile/delete-account", { method: "POST" });
  },

  async getPreferences(): Promise<UserPreferences | null> {
    const { preferences } = await requestJson<{ preferences: UserPreferences | null }>("/api/profile/preferences/get", {
      method: "POST",
    });
    return preferences ?? null;
  },

  async updatePreferences(input: Partial<UserPreferences>): Promise<void> {
    await requestJson("/api/profile/preferences/update", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
