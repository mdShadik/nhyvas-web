export function getGalliStyleUrl() {
  const API_BASE = (process.env.NEXT_PUBLIC_NHYVAS_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${API_BASE}/api/v1/map/style`;
}

