import { jsonError, jsonOk } from "@/app/api/_lib/response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("word") || searchParams.get("name");
    const currentLat = searchParams.get("currentLat");
    const currentLng = searchParams.get("currentLng");

    if (!query) {
      return jsonError("Missing query parameter", 400);
    }

    const apiKey = process.env.NEXT_PUBLIC_GALLI_MAP_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GALLI_MAP_API_KEY is not configured.");
      return jsonError("Map service configuration error", 500);
    }

    // The GalliMap /search/currentLocation endpoint expects "name" for the query string
    let url = `https://route-init.gallimap.com/api/v1/search/currentLocation?accessToken=${apiKey}&name=${encodeURIComponent(query)}`;

    if (currentLat && currentLng) {
      url += `&currentLat=${currentLat}&currentLng=${currentLng}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Upstream map service error:", response.status, errorText);
      return jsonError(`Upstream map service error: ${response.status}`, response.status);
    }

    const data = await response.json();
    return jsonOk(data);
  } catch (error: any) {
    console.error("Map search proxy error:", error);
    return jsonError(error.message || "Internal server error", 500);
  }
}
