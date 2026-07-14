export const API_URL = "/api/v1";

// Server components can't fetch relative URLs, so resolve the origin there.
function resolvedApiUrl(): string {
  if (API_URL.startsWith("http") || typeof window !== "undefined") {
    return API_URL;
  }
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
  return `${origin}${API_URL}`;
}

export type Language = {
  id: string;
  name: string;
  local_name: string | null;
  iso_code: string | null;
};

export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${resolvedApiUrl()}/languages`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`Language API returned ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return [];
    }
    const result: unknown = await response.json();
    return Array.isArray(result) ? (result as Language[]) : [];
  } catch {
    return [];
  }
}
