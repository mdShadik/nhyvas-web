import { requestJson } from "@/services/apiService/http";
import type { i18n as I18nInstance } from "i18next";

type SupportedLanguage = "en" | "np";

const CACHE_PREFIX = "i18n.remote.";

function cacheKey(language: SupportedLanguage) {
  return `${CACHE_PREFIX}${language}`;
}

export function loadCachedRemoteTranslations(i18n: I18nInstance, language: SupportedLanguage) {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(cacheKey(language)) : null;
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    i18n.addResourceBundle(language, "translation", parsed, true, true);
  } catch {}
}

const pendingSyncs = new Set<string>();
const lastSyncTime: Record<string, number> = {};
const SYNC_COOLDOWN = 1000 * 60 * 5; // 5 minutes cooldown

export async function syncRemoteTranslations(i18n: I18nInstance, language: SupportedLanguage) {
  const now = Date.now();
  if (pendingSyncs.has(language)) return;
  if (lastSyncTime[language] && now - lastSyncTime[language] < SYNC_COOLDOWN) return;

  pendingSyncs.add(language);
  try {
    const { bundle } = await requestJson<{ bundle: any }>("/api/i18n/remote", {
      method: "POST",
      body: JSON.stringify({ language }),
    });

    if (!bundle || typeof bundle !== "object") return;

    i18n.addResourceBundle(language, "translation", bundle, true, true);
    lastSyncTime[language] = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(cacheKey(language), JSON.stringify(bundle));
    }
  } catch (err) {
    // Best-effort. App still works with bundled JSON translations.
  } finally {
    pendingSyncs.delete(language);
  }
}
