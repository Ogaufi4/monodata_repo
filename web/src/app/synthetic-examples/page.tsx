"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Example = { id: string; title: string; example_type: string; content: Record<string, unknown>; human_verified: boolean };
export default function SyntheticExamplesPage() {
  const [items, setItems] = useState<Example[]>([]);
  useEffect(() => { fetch(`${API_URL}/synthetic-examples`).then((r) => r.json()).then(setItems); }, []);
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-5xl font-semibold">Synthetic guidance examples</h1>
      <p className="mt-4 text-ink/60">Clearly marked AI-generated examples for guidance—not human gold data.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl bg-white/70 p-6 ring-1 ring-ink/10">
            <div className="flex justify-between"><span className="text-sm text-reed">{item.example_type}</span><span className="text-xs">{item.human_verified ? "Human verified" : "Synthetic"}</span></div>
            <h2 className="mt-3 text-2xl font-semibold">{item.title}</h2>
            <pre className="mt-4 overflow-auto whitespace-pre-wrap text-sm">{JSON.stringify(item.content, null, 2)}</pre>
          </article>
        ))}
      </div>
    </main>
  );
}
