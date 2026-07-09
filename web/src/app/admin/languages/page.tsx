"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/client-api";

type Language = { id: string; name: string; local_name: string | null; iso_code: string | null };
type Category = { id: string; name: string };

export default function TaxonomyAdminPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const load = () => Promise.all([
    fetch(`${API_URL}/languages`).then((response) => response.json()),
    fetch(`${API_URL}/categories`).then((response) => response.json()),
  ]).then(([languageData, categoryData]) => {
    setLanguages(languageData);
    setCategories(categoryData);
  });
  useEffect(() => { load(); }, []);

  async function addLanguage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authenticatedFetch("/languages", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        local_name: form.get("local_name") || null,
        iso_code: form.get("iso_code") || null,
        description: null,
        is_active: true,
      }),
    });
    event.currentTarget.reset();
    setMessage("Language added.");
    load();
  }
  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authenticatedFetch("/categories", {
      method: "POST",
      body: JSON.stringify({ name: form.get("name"), description: form.get("description") || null }),
    });
    event.currentTarget.reset();
    setMessage("Category added.");
    load();
  }
  const input = "mt-2 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3";
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Language and category management</h1>
      {message && <p className="mt-5 text-reed">{message}</p>}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section className="rounded-3xl bg-white/60 p-6">
          <h2 className="text-2xl font-semibold">Languages ({languages.length})</h2>
          <form onSubmit={addLanguage} className="mt-5 space-y-4">
            <input name="name" required placeholder="Language name" className={input} />
            <input name="local_name" placeholder="Local name" className={input} />
            <input name="iso_code" placeholder="ISO code" className={input} />
            <button className="rounded-full bg-reed px-5 py-2.5 text-white">Add language</button>
          </form>
          <ul className="mt-6 space-y-2">{languages.map((language) => <li key={language.id}>{language.local_name || language.name}</li>)}</ul>
        </section>
        <section className="rounded-3xl bg-white/60 p-6">
          <h2 className="text-2xl font-semibold">Categories ({categories.length})</h2>
          <form onSubmit={addCategory} className="mt-5 space-y-4">
            <input name="name" required placeholder="Category name" className={input} />
            <textarea name="description" placeholder="Description" className={input} />
            <button className="rounded-full bg-reed px-5 py-2.5 text-white">Add category</button>
          </form>
          <ul className="mt-6 space-y-2">{categories.map((category) => <li key={category.id}>{category.name}</li>)}</ul>
        </section>
      </div>
    </main>
  );
}
