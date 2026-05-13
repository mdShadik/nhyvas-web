const STORAGE_KEY = "my-ads-cache";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function getCachedListing(id: string): Record<string, unknown> | undefined {
  if (!isBrowser()) return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const cache = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    return cache[id];
  } catch {
    return undefined;
  }
}

export function cacheListings(listings: Record<string, unknown>[]): void {
  if (!isBrowser()) return;
  try {
    const cache: Record<string, Record<string, unknown>> = {};
    for (const item of listings) {
      const id = String(item.id ?? "");
      if (id) cache[id] = item;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full or unavailable – silently ignore
  }
}
