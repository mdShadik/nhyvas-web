import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import np from "./np.json";
import { loadCachedRemoteTranslations, syncRemoteTranslations } from "./remote";

const STORAGE_KEY = "app.language";
export const supportedLanguages = ["en", "np"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function normalizeLanguage(input: string | null | undefined): SupportedLanguage {
  const normalized = (input ?? "").trim().toLowerCase();
  if (normalized === "np" || normalized === "ne" || normalized.startsWith("ne")) return "np";
  return "en";
}

function getDeviceLanguage(): SupportedLanguage {
  try {
    const candidate =
      (typeof navigator !== "undefined" ? navigator.language : null) ??
      "en";
    return normalizeLanguage(candidate);
  } catch {
    return "en";
  }
}

export function getInitialLanguage(): SupportedLanguage {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (stored) return normalizeLanguage(stored);
  return getDeviceLanguage();
}

export function setAppLanguage(language: SupportedLanguage) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, language);
  void i18n.changeLanguage(language);
}

if (!i18n.isInitialized) {
  // Frontend-only strings live in JSON. Master-data strings come from backend translation tables.
  // This prevents shipping app updates for master data text changes.
  const { master_data: _masterDataEn, ...frontendEn } = (en as any) ?? {};
  const { master_data: _masterDataNp, ...frontendNp } = (np as any) ?? {};

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: frontendEn },
      np: { translation: frontendNp },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  const initialLang = normalizeLanguage(i18n.language);
  loadCachedRemoteTranslations(i18n, initialLang);
  void syncRemoteTranslations(i18n, initialLang);

  i18n.on("languageChanged", (next) => {
    const lang = normalizeLanguage(next);
    loadCachedRemoteTranslations(i18n, lang);
    void syncRemoteTranslations(i18n, lang);
  });
}

export default i18n;
