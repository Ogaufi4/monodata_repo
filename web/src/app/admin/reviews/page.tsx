"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/client-api";

type Item = { id: string; title: string; contribution_type: string; description: string };
export default function ReviewsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const load = () => authenticatedFetch("/reviews/pending").then(setItems).catch((caught) => setError(caught.message));
  useEffect(() => { load(); }, []);
  async function decide(id: string, action: string) {
    const notes = window.prompt("Reviewer notes (optional)") || null;
    await authenticatedFetch(`/contributions/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ action, notes, quality_score: action === "approve" ? 80 : null }),
    });
    load();
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Review queue</h1>
      {error && <p className="mt-5 text-red-700">{error}</p>}
      <div className="mt-10 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl bg-white/70 p-6 ring-1 ring-ink/10">
            <p className="text-sm text-reed">{item.contribution_type}</p>
            <h2 className="mt-2 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-ink/60">{item.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => decide(item.id, "approve")} className="rounded-full bg-reed px-4 py-2 text-white">Approve</button>
              <button onClick={() => decide(item.id, "request_changes")} className="rounded-full bg-sun px-4 py-2">Request changes</button>
              <button onClick={() => decide(item.id, "reject")} className="rounded-full bg-red-700 px-4 py-2 text-white">Reject</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
