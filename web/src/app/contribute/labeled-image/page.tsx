"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL, type Language } from "@/lib/api";
import { accessToken, authenticatedFetch } from "@/lib/client-api";

type Category = { id: string; name: string };

export default function LabeledImagePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/languages`).then((r) => r.json()),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
    ]).then(([l, c]) => { setLanguages(l); setCategories(c); });
  }, []);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  function selectFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(next ? URL.createObjectURL(next) : "");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    if (!file || !accessToken()) { setError("Choose an image and sign in."); return; }
    try {
      const draft = await authenticatedFetch("/contributions", { method: "POST", body: JSON.stringify({
        contribution_type: "labeled_image", title: form.get("title"), description: form.get("description"),
        language_id: form.get("language_id"), category_id: form.get("category_id"), domain: form.get("domain"),
        source: "Contributor image", license_type: "CC BY 4.0", tags: [],
      }) });
      const signed = await authenticatedFetch("/uploads/signed-url", { method: "POST", body: JSON.stringify({
        contribution_id: draft.id, filename: file.name, content_type: file.type, file_size: file.size,
      }) });
      const put = await fetch(signed.upload_url, { method: "PUT", headers: signed.required_headers, body: file });
      if (!put.ok) throw new Error("Image upload failed");
      const asset = await authenticatedFetch("/uploads/confirm", { method: "POST", body: JSON.stringify({ upload_token: signed.upload_token }) });
      await authenticatedFetch("/image-annotations", { method: "POST", body: JSON.stringify({
        asset_id: asset.id, label_name: form.get("label_name"), label_language_id: form.get("language_id"),
        annotation_type: "bounding_box", x_min: Number(form.get("x_min")), y_min: Number(form.get("y_min")),
        x_max: Number(form.get("x_max")), y_max: Number(form.get("y_max")), is_synthetic: false,
      }) });
      await authenticatedFetch(`/contributions/${draft.id}/consent`, { method: "POST", body: JSON.stringify({
        consent_version: "1.0", use_for_ai_training: true, use_for_research: true,
        use_for_commercial: false, allow_open_release: false, allow_attribution: false,
      }) });
      await authenticatedFetch(`/contributions/${draft.id}/submit`, { method: "POST" });
      setMessage("Labeled image submitted for review.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Submission failed"); }
  }
  const input = "mt-2 w-full rounded-xl border border-ink/15 bg-white p-3";
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Label an image</h1>
      <p className="mt-4 text-ink/60">Upload an image and define a bounding box using percentages from its top-left corner.</p>
      <form onSubmit={submit} className="mt-10 space-y-5">
        <input name="title" required placeholder="Title" className={input} />
        <textarea name="description" required placeholder="Description" className={input} />
        <div className="grid gap-4 md:grid-cols-3">
          <select name="language_id" required className={input}><option value="">Language</option>{languages.map((l) => <option key={l.id} value={l.id}>{l.local_name || l.name}</option>)}</select>
          <select name="category_id" required className={input}><option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input name="domain" required placeholder="Domain" className={input} />
        </div>
        <input type="file" accept="image/*" required onChange={(e) => selectFile(e.target.files?.[0] || null)} className={input} />
        {preview && <div className="relative overflow-hidden rounded-3xl bg-white">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={preview} alt="Annotation preview" className="max-h-[32rem] w-full object-contain" /></div>}
        <input name="label_name" required placeholder="Object label" className={input} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {["x_min", "y_min", "x_max", "y_max"].map((name, index) => <label key={name} className="text-sm">{name}<input name={name} type="number" min="0" max="100" step="0.1" defaultValue={index < 2 ? 10 : 90} required className={input} /></label>)}
        </div>
        <p className="text-sm text-ink/55">Coordinates are percentages (0–100) and are retained consistently for export conversion.</p>
        {error && <p className="text-red-700">{error}</p>}{message && <p className="text-reed">{message}</p>}
        <button className="rounded-full bg-reed px-6 py-3 text-white">Upload, label, and submit</button>
      </form>
    </main>
  );
}
