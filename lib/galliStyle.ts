export function getGalliStyleUrl() {
  const key = (process.env.NEXT_PUBLIC_GALLI_MAP_API_KEY ?? "").trim();
  if (!key) return null;
  return `https://map-init.gallimap.com/styles/light/style.json?accessToken=${key}`;
}

