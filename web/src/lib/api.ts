export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.diteme.com/api/v1";

export type Language = {
  id: string;
  name: string;
  local_name: string | null;
  iso_code: string | null;
};

export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${API_URL}/languages`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error(`Language API returned ${response.status}`);
    }
    return response.json() as Promise<Language[]>;
  } catch {
    return [];
  }
}
