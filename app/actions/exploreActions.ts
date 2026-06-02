"use server";

export async function performAiSearch(query: string, lat?: number | null, lng?: number | null) {
  try {
    const API_BASE = (process.env.NEXT_PUBLIC_NHYVAS_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
    const apiUrl = `${API_BASE}/api/v1/explore/ai-search`;
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        lat,
        lng,
      })
    });
    
    if (!res.ok) {
      throw new Error(`Go API returned ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("performAiSearch Error:", error);
    throw error;
  }
}
