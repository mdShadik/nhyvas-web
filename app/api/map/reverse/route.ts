import { jsonError, jsonOk } from "@/app/api/_lib/response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return jsonError("Missing lat or lng parameters", 400);
    }

    const apiKey = process.env.NEXT_PUBLIC_GALLI_MAP_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GALLI_MAP_API_KEY is not configured.");
      return jsonError("Map service configuration error", 500);
    }

    const url = `https://route-init.gallimap.com/api/v1/reverse/generalReverse?accessToken=${apiKey}&lat=${lat}&lng=${lng}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return jsonError("Upstream map service error", response.status);
    }

    const data = await response.json();
    return jsonOk(data);
  } catch (error: any) {
    console.error("Reverse geocode proxy error:", error);
    return jsonError(error.message || "Internal server error", 500);
  }
}
