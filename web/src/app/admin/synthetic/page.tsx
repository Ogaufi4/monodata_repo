"use client";

import { FormEvent, useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/client-api";
import { API_URL } from "@/lib/api";

export default function SyntheticAdminPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const load = () => fetch(`${API_URL}/synthetic-examples`).then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authenticatedFetch("/synthetic-examples", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"), example_type: form.get("example_type"),
        synthetic_source_model: form.get("model"),
        prompt_used: form.get("prompt") || null,
        content: { source_text: form.get("source_text"), target_text: form.get("target_text") },
      }),
    });
    event.currentTarget.reset(); load();
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Synthetic guidance</h1>
      <form onSubmit={create} className="mt-10 grid gap-4 rounded-3xl bg-white/60 p-6 md:grid-cols-2">
        {["title", "example_type", "model", "source_text", "target_text", "prompt"].map((name) => <input key={name} name={name} required={!["prompt"].includes(name)} placeholder={name.replaceAll("_", " ")} className="rounded-xl border p-3" />)}
        <button className="rounded-full bg-reed px-5 py-3 text-white">Create synthetic example</button>
      </form>
      <div className="mt-8 space-y-3">{items.map((item) => (
        <div key={String(item.id)} className="flex justify-between rounded-2xl bg-white/60 p-5">
          <span>{String(item.title)}</span>
          {!item.human_verified && <button onClick={async () => { await authenticatedFetch(`/synthetic-examples/${item.id}/verify`, { method: "PATCH" }); load(); }} className="text-reed">Mark human verified</button>}
        </div>
      ))}</div>
    </main>
  );
}
