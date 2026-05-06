import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

type SupportedLanguage = "en" | "np";

type TranslationKeyRow = {
  id: string;
  namespace: string;
  key: string;
  default_text: string;
  is_active: boolean;
};

type TranslationValueRow = {
  translation_key_id: string;
  locale_code: string;
  value: string;
};

function setDeep(target: any, path: string[], value: any) {
  let cursor = target;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    if (i === path.length - 1) {
      cursor[segment] = value;
      return;
    }
    if (cursor[segment] == null || typeof cursor[segment] !== "object") {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { language?: SupportedLanguage };
  const language = body?.language === "np" ? "np" : "en";
  const localeCodes = language === "np" ? (["np", "ne"] as const) : (["en"] as const);

  const supabase = createSupabasePublicClient();

  const { data: keyRows, error: keyError } = await supabase
    .from("master_translation_keys")
    .select("id, namespace, key, default_text, is_active")
    .eq("is_active", true);
  if (keyError) return jsonError(keyError.message, 400);

  const keys = (keyRows ?? []) as TranslationKeyRow[];
  if (keys.length === 0) return jsonOk({ bundle: {} });

  const { data: valueRows, error: valueError } = await supabase
    .from("master_translation_values")
    .select("translation_key_id, locale_code, value")
    .in("locale_code", [...localeCodes]);
  if (valueError) return jsonError(valueError.message, 400);

  const values = (valueRows ?? []) as TranslationValueRow[];
  const valueByKeyId = new Map<string, { locale_code: string; value: string }>();
  for (const row of values) {
    if (typeof row.translation_key_id !== "string") continue;
    if (typeof row.value !== "string") continue;
    if (typeof row.locale_code !== "string") continue;

    const existing = valueByKeyId.get(row.translation_key_id);
    if (!existing) {
      valueByKeyId.set(row.translation_key_id, { locale_code: row.locale_code, value: row.value });
      continue;
    }

    const localeCodesArr = localeCodes as readonly string[];
    const existingRank = localeCodesArr.indexOf(existing.locale_code);
    const nextRank = localeCodesArr.indexOf(row.locale_code);
    const shouldReplace = nextRank !== -1 && (existingRank === -1 || nextRank < existingRank);
    if (shouldReplace) {
      valueByKeyId.set(row.translation_key_id, { locale_code: row.locale_code, value: row.value });
    }
  }

  const bundle: any = {};
  for (const k of keys) {
    const value = valueByKeyId.get(k.id)?.value ?? k.default_text;
    const fullPath = `${k.namespace}.${k.key}`.split(".").filter(Boolean);
    if (fullPath.length === 0) continue;
    setDeep(bundle, fullPath, value);
  }

  return jsonOk({ bundle });
}

