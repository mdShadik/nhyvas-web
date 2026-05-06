export const authCookieNames = {
  accessToken: "nhyvas_at",
  refreshToken: "nhyvas_rt",
} as const;

export type AuthCookieNames = typeof authCookieNames;

