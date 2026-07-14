import { API_URL } from "@/lib/api";

export type GuidedPrompt = {
  id: string;
  source_text: string;
  domain: string;
  difficulty: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  context: string | null;
  tags?: string[];
  remaining_count?: number;
};

export type Category = { id: string; name: string };

/** Corpus domains map onto the seeded categories, so contributors never pick one. */
export const DOMAIN_CATEGORY: Record<string, string> = {
  daily_life: "Everyday speech",
  family: "Family",
  education: "Education",
  health: "Health",
  agriculture: "Agriculture",
  law: "Law & justice",
  government: "Government services",
  commerce: "Commerce & market",
  transport: "Transport",
  technology: "Technology",
  environment: "Environment & nature",
  culture: "Culture & heritage",
};

export function authToken(): string | null {
  return localStorage.getItem("biidp_access_token");
}

/** GET a list endpoint, refusing anything that is not an array. */
export async function loadList<T>(path: string): Promise<T[]> {
  const response = await fetch(`${API_URL}${path}`);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    throw new Error(`Could not load ${path}`);
  }
  return data as T[];
}

export async function apiPost(path: string, token: string, body?: object) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : result.detail?.message || "Request failed",
    );
  }
  return result;
}

/** Pull the next prompt that still needs work for this language and task. */
export async function nextPrompt(
  token: string,
  languageId: string,
  taskType: "translation" | "pronunciation" | "conversation",
): Promise<{ prompt: GuidedPrompt | null; detail?: string }> {
  const response = await fetch(
    `${API_URL}/word-prompts/next?language_id=${languageId}&task_type=${taskType}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string" ? result.detail : "Could not load a prompt",
    );
  }
  return result;
}

export function categoryForDomain(categories: Category[], domain: string): Category | undefined {
  return categories.find((item) => item.name === DOMAIN_CATEGORY[domain]) ?? categories[0];
}

/**
 * Everything the API demands but the contributor should never have to invent:
 * title, description, domain, category and tags all come from the prompt.
 */
export function derivedMetadata(
  prompt: GuidedPrompt,
  languageName: string,
  categories: Category[],
  noun: string,
) {
  const category = categoryForDomain(categories, prompt.domain);
  if (!category) {
    throw new Error("No categories are configured.");
  }
  return {
    title: prompt.source_text.slice(0, 200),
    description: `${languageName} ${noun} for the English prompt "${prompt.source_text}".`,
    category_id: category.id,
    domain: prompt.domain,
    tags: prompt.tags ?? [prompt.domain, prompt.difficulty],
    source: "Guided English prompt",
    license_type: "CC BY 4.0",
  };
}

export const STANDARD_CONSENT = {
  consent_version: "1.0",
  use_for_ai_training: true,
  use_for_research: true,
  use_for_commercial: false,
  allow_open_release: true,
  allow_attribution: true,
};

export const fieldClass =
  "mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed";
