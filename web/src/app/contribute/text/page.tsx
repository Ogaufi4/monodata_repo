"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { type Language } from "@/lib/api";
import {
  apiPost,
  authToken,
  DOMAIN_CATEGORY,
  fieldClass,
  loadList,
  STANDARD_CONSENT,
  type Category,
} from "@/lib/guided";

const CATEGORY_DOMAIN: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_CATEGORY).map(([domain, category]) => [category, domain]),
);

const KINDS = [
  { value: "story", label: "A story" },
  { value: "proverb", label: "A proverb or saying" },
  { value: "practice", label: "A custom or practice" },
];

export default function CulturalKnowledgePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [kind, setKind] = useState("story");
  const [body, setBody] = useState("");
  const [meaning, setMeaning] = useState("");
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([loadList<Language>("/languages"), loadList<Category>("/categories")])
      .then(([languageData, categoryData]) => {
        setLanguages(languageData);
        setCategories(categoryData);
        const culture = categoryData.find((item) => item.name === "Culture & heritage");
        if (culture) setCategoryId(culture.id);
      })
      .catch(() => setNotice({ text: "Could not load the language list.", isError: true }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = authToken();
    if (!token) {
      setNotice({ text: "Sign in before sharing knowledge.", isError: true });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const category = categories.find((item) => item.id === categoryId);
      const languageName = languages.find((item) => item.id === language)?.name ?? "the language";
      if (!category) throw new Error("Choose a topic.");

      const kindLabel = KINDS.find((item) => item.value === kind)?.label ?? "A story";
      const firstLine = body.trim().split("\n")[0];

      // Title and description come from what was written — nothing to invent.
      const draft = await apiPost("/contributions", token, {
        contribution_type: "cultural_knowledge",
        title: firstLine.slice(0, 200),
        description: `${kindLabel} shared in ${languageName}.`,
        language_id: language,
        category_id: category.id,
        domain: CATEGORY_DOMAIN[category.name] ?? "culture",
        tags: [kind],
        source: "Contributor knowledge",
        license_type: "CC BY 4.0",
      });

      await apiPost("/translations", token, {
        contribution_id: draft.id,
        source_text: body.trim(),
        target_text: meaning.trim() || body.trim(),
        context: kindLabel,
      });

      await apiPost(`/contributions/${draft.id}/consent`, token, STANDARD_CONSENT);
      await apiPost(`/contributions/${draft.id}/submit`, token);

      setBody("");
      setMeaning("");
      setNotice({ text: "Thank you. Submitted for review.", isError: false });
    } catch (caught) {
      setNotice({
        text: caught instanceof Error ? caught.message : "Submission failed",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/contribute" className="text-sm font-medium text-reed">
        ← Contribution types
      </Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">Share knowledge</h1>
      <p className="mt-4 text-ink/60">
        A story, a proverb, or a custom, written in your own language. The title and
        description are filled in for you.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Language</span>
            <select
              required
              className={fieldClass}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="">Select your language</option>
              {languages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.local_name || item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">What are you sharing?</span>
            <select
              required
              className={fieldClass}
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              {KINDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Topic</span>
          <select
            required
            className={fieldClass}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Select a topic</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Write it in your language</span>
          <textarea
            required
            rows={6}
            className={fieldClass}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">What does it mean in English? (optional)</span>
          <textarea
            rows={3}
            className={fieldClass}
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
          />
        </label>

        <label className="flex gap-3 text-sm">
          <input type="checkbox" required className="mt-0.5" />
          <span>
            I agree this may be stored, reviewed, and used for research and responsible AI
            training, with attribution and open release. Commercial use is not granted.
          </span>
        </label>

        {notice && (
          <p className={`text-sm ${notice.isError ? "text-red-700" : "text-reed"}`}>
            {notice.text}
          </p>
        )}

        <button
          disabled={loading || !body.trim()}
          className="w-full rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Submit"}
        </button>
      </form>
    </main>
  );
}
