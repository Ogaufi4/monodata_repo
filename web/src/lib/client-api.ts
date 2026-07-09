import { API_URL } from "@/lib/api";

export function accessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("biidp_access_token");
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const token = accessToken();
  if (!token) throw new Error("Please sign in to continue.");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result?.detail === "string"
        ? result.detail
        : result?.detail?.message || "Request failed",
    );
  }
  return result;
}
