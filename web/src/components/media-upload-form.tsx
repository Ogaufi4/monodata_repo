"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { API_URL, type Language } from "@/lib/api";

type Category = { id: string; name: string };

type MediaUploadFormProps = {
  heading: string;
  contributionType: "audio_recording" | "image" | "video" | "document";
  accept: string;
  mediaLabel: string;
};

export function MediaUploadForm({
  heading,
  contributionType,
  accept,
  mediaLabel,
}: MediaUploadFormProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
      .catch(() => setError("Could not load contribution metadata."));
  }, []);

  async function apiRequest(path: string, token: string, body: object) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    const token = localStorage.getItem("biidp_access_token");
    if (!token) {
      setError("Sign in before uploading a contribution.");
      return;
    }
    if (!(file instanceof File) || !file.size) {
      setError(`Choose a ${mediaLabel.toLowerCase()} file.`);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const draft = await apiRequest("/contributions", token, {
        contribution_type: contributionType,
        title: String(form.get("title")),
        description: String(form.get("description")),
        language_id: String(form.get("language_id")),
        category_id: String(form.get("category_id")),
        domain: String(form.get("domain")),
        tags: [],
        source: "Contributor upload",
        license_type: String(form.get("license_type")),
      });
      const signed = await apiRequest("/uploads/signed-url", token, {
        contribution_id: draft.id,
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });
      const upload = await fetch(signed.upload_url, {
        method: "PUT",
        headers: signed.required_headers,
        body: file,
      });
      if (!upload.ok) {
        throw new Error(`Object storage rejected the upload (${upload.status}).`);
      }
      await apiRequest("/uploads/confirm", token, {
        upload_token: signed.upload_token,
      });
      await apiRequest(`/contributions/${draft.id}/consent`, token, {
        consent_version: "1.0",
        use_for_ai_training: form.get("use_for_ai_training") === "on",
        use_for_research: form.get("use_for_research") === "on",
        use_for_commercial: form.get("use_for_commercial") === "on",
        allow_open_release: form.get("allow_open_release") === "on",
        allow_attribution: form.get("allow_attribution") === "on",
      });
      await apiRequest(`/contributions/${draft.id}/submit`, token, {});
      formElement.reset();
      setMessage(`${mediaLabel} submitted for review. Thank you.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
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
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">{heading}</h1>
      <p className="mt-4 text-ink/60">
        Files upload directly to private object storage. The platform records
        metadata only after verifying the stored object.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea name="description" required className={fieldClass} />
        </label>
        <div className="grid gap-5 md:grid-cols-3">
          <label>
            <span className="text-sm font-medium">Language</span>
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
          <span className="text-sm font-medium">{mediaLabel} file</span>
          <input name="file" type="file" accept={accept} required className={fieldClass} />
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
          {loading ? "Uploading…" : `Submit ${mediaLabel.toLowerCase()}`}
        </button>
      </form>
    </main>
  );
}
