"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { API_URL, type Language } from "@/lib/api";

type Category = { id: string; name: string };

export default function TranslationPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/languages`).then((response) => response.json()),
      fetch(`${API_URL}/categories`).then((response) => response.json()),
    ])
      .then(([languageData, categoryData]) => {
        setLanguages(languageData);
        setCategories(categoryData);
      })
      .catch(() => setError("Could not load the language taxonomy."));
  }, []);

  async function request(path: string, token: string, body?: object) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      const detail =
        typeof result.detail === "string"
          ? result.detail
          : result.detail?.message || "Submission failed";
      throw new Error(detail);
    }
    return result;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setError("");
    setMessage("");
    const token = localStorage.getItem("biidp_access_token");
    if (!token) {
      setError("Sign in before submitting a contribution.");
      setLoading(false);
      return;
    }
    const form = new FormData(formElement);

    try {
      const draft = await request("/contributions", token, {
        contribution_type: "translation",
        title: String(form.get("title")),
        description: String(form.get("description")),
        language_id: String(form.get("language_id")),
        target_language_id: String(form.get("target_language_id")),
        category_id: String(form.get("category_id")),
        domain: String(form.get("domain")),
        tags: String(form.get("tags"))
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        source: "Contributor knowledge",
        license_type: String(form.get("license_type")),
      });
      await request("/translations", token, {
        contribution_id: draft.id,
        source_text: String(form.get("source_text")),
        target_text: String(form.get("target_text")),
        context: String(form.get("context")) || null,
      });
      await request(`/contributions/${draft.id}/consent`, token, {
        consent_version: "1.0",
        use_for_ai_training: form.get("use_for_ai_training") === "on",
        use_for_research: form.get("use_for_research") === "on",
        use_for_commercial: form.get("use_for_commercial") === "on",
        allow_open_release: form.get("allow_open_release") === "on",
        allow_attribution: form.get("allow_attribution") === "on",
      });
      await request(`/contributions/${draft.id}/submit`, token);
      formElement.reset();
      setMessage("Translation submitted for review. Thank you.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/contribute" className="text-sm font-medium text-reed">
        ← Contribution types
      </Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">
        Add a translation
      </h1>
      <form onSubmit={submit} className="mt-10 space-y-6">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea name="description" required className={fieldClass} />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Translate from</span>
            <select name="language_id" required className={fieldClass}>
              <option value="">Select language</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.local_name || language.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Translate to</span>
            <select name="target_language_id" required className={fieldClass}>
              <option value="">Select language</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.local_name || language.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Source text</span>
            <textarea name="source_text" required className={fieldClass} />
          </label>
          <label>
            <span className="text-sm font-medium">Translation</span>
            <textarea name="target_text" required className={fieldClass} />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Category</span>
            <select name="category_id" required className={fieldClass}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Domain</span>
            <input name="domain" required className={fieldClass} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Context</span>
          <textarea name="context" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Tags, separated by commas</span>
          <input name="tags" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">License</span>
          <select name="license_type" required className={fieldClass}>
            <option value="CC BY 4.0">CC BY 4.0</option>
            <option value="CC BY-NC 4.0">CC BY-NC 4.0</option>
          </select>
        </label>

        <fieldset className="rounded-3xl border border-ink/10 bg-white/50 p-6">
          <legend className="px-2 font-semibold">Consent</legend>
          <div className="space-y-3 text-sm">
            <label className="flex gap-3 font-medium">
              <input type="checkbox" required />
              <span>I consent to storage and review of this contribution</span>
            </label>
            {[
              ["use_for_ai_training", "Use for responsible AI training"],
              ["use_for_research", "Use for research"],
              ["use_for_commercial", "Allow commercial use"],
              ["allow_open_release", "Allow inclusion in open datasets"],
              ["allow_attribution", "Allow contributor attribution"],
            ].map(([name, label]) => (
              <label key={name} className="flex gap-3">
                <input name={name} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm font-medium text-reed">{message}</p>}
        <button
          disabled={loading || !languages.length || !categories.length}
          className="rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </main>
  );
}
