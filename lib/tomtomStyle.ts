export function getTomTomStyleUrl() {
  const key = (process.env.NEXT_PUBLIC_TOMTOM_KEY ?? "").trim();
  const rawStyleUrl = (process.env.NEXT_PUBLIC_TOMTOM_STYLE_URL ?? "").trim();
  const styleId = (process.env.NEXT_PUBLIC_TOMTOM_STYLE_ID ?? "").trim();

  if (rawStyleUrl) {
    if (key && rawStyleUrl.includes("{key}")) return rawStyleUrl.replaceAll("{key}", key);

    // TomTom "draft" style URLs commonly 403 outside Map Maker. Prefer the published style endpoint.
    if (rawStyleUrl.includes("/drafts/") && styleId && key) {
      return `https://api.tomtom.com/style/2/custom/style/${styleId}.json?key=${key}`;
    }

    // If user forgot to include the API key in the URL, try to append it.
    if (key && rawStyleUrl.includes("api.tomtom.com") && !rawStyleUrl.includes("key=")) {
      const joiner = rawStyleUrl.includes("?") ? "&" : "?";
      return `${rawStyleUrl}${joiner}key=${key}`;
    }

    return rawStyleUrl;
  }

  if (styleId && key) {
    return `https://api.tomtom.com/style/2/custom/style/${styleId}.json?key=${key}`;
  }

  return "https://demotiles.maplibre.org/style.json";
}

