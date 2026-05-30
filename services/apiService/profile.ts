import { requestJson } from "@/services/apiService/http";

export type AppProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  phone?: string | null;
  landlord_verified?: boolean;
  push_opt_in?: boolean;
  is_onboarded?: boolean;
  max_addresses?: number;
  ai_credit?: number;
  is_vip_user?: boolean;
  ai_base_credit?: number;
  ai_display_credit_amount?: number;
  ai_bonus_credit?: number;
  ai_total_credit?: number;
  ai_used_credit?: number;
  ai_remaining_credit?: number;
  ai_is_new_user_bonus?: boolean;
  ai_quota_label?: string;
};


export type UserPreferences = {
  user_id: string;
  min_price: number | null;
  max_price: number | null;
  category_id: string | null;
  category_code: string | null;
  preferred_amenities: string[];
};

export type LandlordVerificationInput = {
  legalName: string;
  phoneNumber: string;
  houseImageUrl: string;
};

export type CompleteOnboardingInput = {
  fullName: string;
  email?: string | null;
  avatarUri?: string | null;
};

export type RegisterPushDeviceInput = {
  expoPushToken: string;
  deviceId?: string;
  platform: "ios" | "android" | "web";
  appVersion?: string;
  appBuild?: string;
};

type ProfileApiRow = AppProfile &
  UserPreferences & {
    maxAddresses?: number;
  };

export const profileService = {
  async getBootstrap(): Promise<{
    profile: AppProfile | null;
    preferences: UserPreferences | null;
  }> {
    const { row } = await requestJson<{ row: ProfileApiRow | null }>("/api/profile/bootstrap", { method: "POST" });
    if (!row) {
      return { profile: null, preferences: null };
    }

    const profile: AppProfile = {
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      avatar_url: row.avatar_url ?? null,
      role: row.role ?? null,
      phone: row.phone ?? null,
      landlord_verified: row.landlord_verified ?? false,
      push_opt_in: row.push_opt_in ?? true,
      max_addresses: row.maxAddresses ?? 3,
      ai_credit: Number(row.ai_credit ?? 0),
      is_vip_user: row.is_vip_user ?? false,
      ai_base_credit: Number(row.ai_base_credit ?? 0),
      ai_display_credit_amount: Number(row.ai_display_credit_amount ?? 0),
      ai_bonus_credit: Number(row.ai_bonus_credit ?? 0),
      ai_total_credit: Number(row.ai_total_credit ?? 0),
      ai_used_credit: Number(row.ai_used_credit ?? 0),
      ai_remaining_credit: Number(row.ai_remaining_credit ?? 0),
      ai_is_new_user_bonus: row.ai_is_new_user_bonus ?? false,
      ai_quota_label: row.ai_quota_label ?? "standard",
    };

    const preferences: UserPreferences = {
      user_id: row.id,
      min_price: row.min_price ?? null,
      max_price: row.max_price ?? null,
      category_id: row.category_id ?? null,
      category_code: row.category_code ?? null,
      preferred_amenities: row.preferred_amenities ?? [],
    };

    return { profile, preferences };
  },

  async getCurrentProfile(): Promise<AppProfile | null> {
    const { profile } = await requestJson<{ profile: ProfileApiRow | null }>("/api/profile/current", { method: "POST" });
    if (!profile) return null;
    return {
      ...profile,
      max_addresses: profile.maxAddresses ?? 3,
      ai_credit: Number(profile.ai_credit ?? 0),
      is_vip_user: profile.is_vip_user ?? false,
      ai_base_credit: Number(profile.ai_base_credit ?? 0),
      ai_display_credit_amount: Number(profile.ai_display_credit_amount ?? 0),
      ai_bonus_credit: Number(profile.ai_bonus_credit ?? 0),
      ai_total_credit: Number(profile.ai_total_credit ?? 0),
      ai_used_credit: Number(profile.ai_used_credit ?? 0),
      ai_remaining_credit: Number(profile.ai_remaining_credit ?? 0),
      ai_is_new_user_bonus: profile.ai_is_new_user_bonus ?? false,
      ai_quota_label: profile.ai_quota_label ?? "standard",
    };
  },

  async submitLandlordVerification(input: LandlordVerificationInput): Promise<void> {
    await requestJson("/api/profile/landlord-verify", {
      method: "POST",
      body: JSON.stringify(input),
    });
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

  async registerPushDevice(input: RegisterPushDeviceInput): Promise<void> {
    await requestJson("/api/profile/push-device/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async togglePushOptIn(enabled: boolean): Promise<void> {
    await requestJson("/api/profile/push-opt-in/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
  },
};
