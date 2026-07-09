"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { accessToken, authenticatedFetch } from "@/lib/client-api";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Record<string, unknown>[]>([]);
  const [exports, setExports] = useState<Record<string, unknown>[]>([]);
  const load = () => Promise.all([authenticatedFetch("/datasets"), authenticatedFetch("/dataset-exports")]).then(([d, e]) => { setDatasets(d); setExports(e); });
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await authenticatedFetch("/datasets", { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description") || null, contribution_type: form.get("type") || null, include_synthetic: false }) });
    event.currentTarget.reset(); load();
  }
  async function download(id: string) {
    const response = await fetch(`${API_URL}/dataset-exports/${id}/download`, { headers: { Authorization: `Bearer ${accessToken()}` } });
    const blob = await response.blob(); const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `dataset-${id}.jsonl`; anchor.click(); URL.revokeObjectURL(url);
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Dataset builder</h1>
      <form onSubmit={create} className="mt-10 grid gap-4 rounded-3xl bg-white/60 p-6 md:grid-cols-2">
        <input name="name" required placeholder="Dataset name" className="rounded-xl border p-3" />
        <input name="type" placeholder="Contribution type filter" className="rounded-xl border p-3" />
        <textarea name="description" placeholder="Description" className="rounded-xl border p-3 md:col-span-2" />
        <button className="rounded-full bg-reed px-5 py-3 text-white">Build from approved data</button>
      </form>
      <h2 className="mt-10 text-2xl font-semibold">Datasets</h2>
      {datasets.map((dataset) => <div key={String(dataset.id)} className="mt-3 flex justify-between rounded-2xl bg-white/60 p-5"><span>{String(dataset.name)}</span><button onClick={async () => { await authenticatedFetch(`/datasets/${dataset.id}/export`, { method: "POST" }); load(); }} className="text-reed">Generate JSONL</button></div>)}
      <h2 className="mt-10 text-2xl font-semibold">Exports</h2>
      {exports.map((item) => <div key={String(item.id)} className="mt-3 flex justify-between rounded-2xl bg-white/60 p-5"><span>{String(item.item_count)} items</span><button onClick={() => download(String(item.id))} className="text-reed">Download</button></div>)}
    </main>
  );
}
