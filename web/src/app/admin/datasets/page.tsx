"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { API_URL, type Language } from "@/lib/api";
import { accessToken, authenticatedFetch } from "@/lib/client-api";
import { fieldClass, loadList } from "@/lib/guided";

type Dataset = {
  id: string;
  name: string;
  description: string | null;
  filters: {
    language_id: string | null;
    contribution_type: string | null;
    minimum_quality_score: number | null;
    include_synthetic: boolean;
  };
  created_at: string;
};

type DatasetExport = {
  id: string;
  dataset_id: string;
  export_format: string;
  status: string;
  item_count: number;
  created_at: string;
};

const CONTRIBUTION_TYPES = [
  "translation",
  "conversation",
  "audio_recording",
  "cultural_knowledge",
  "image",
  "labeled_image",
  "video",
  "document",
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [exports, setExports] = useState<DatasetExport[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [datasetData, exportData] = await Promise.all([
        authenticatedFetch("/datasets"),
        authenticatedFetch("/dataset-exports"),
      ]);
      setDatasets(datasetData);
      setExports(exportData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load datasets.");
    }
  }, []);

  useEffect(() => {
    void load();
    loadList<Language>("/languages")
      .then(setLanguages)
      .catch(() => undefined);
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("create");
    setError("");
    try {
      const quality = String(form.get("minimum_quality_score") ?? "").trim();
      await authenticatedFetch("/datasets", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description") || null,
          language_id: form.get("language_id") || null,
          contribution_type: form.get("contribution_type") || null,
          minimum_quality_score: quality ? Number(quality) : null,
          include_synthetic: form.get("include_synthetic") === "on",
        }),
      });
      formElement.reset();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build the dataset.");
    } finally {
      setBusy(null);
    }
  }

  async function generate(datasetId: string) {
    setBusy(datasetId);
    setError("");
    try {
      await authenticatedFetch(`/datasets/${datasetId}/export`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the export.");
    } finally {
      setBusy(null);
    }
  }

  async function download(exportId: string, datasetName: string) {
    const response = await fetch(`${API_URL}/dataset-exports/${exportId}/download`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    });
    if (!response.ok) {
      setError("Could not download the export.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${datasetName.replace(/\s+/g, "-").toLowerCase()}.jsonl`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function describeFilters(dataset: Dataset): string {
    const parts: string[] = [];
    const language = languages.find((item) => item.id === dataset.filters?.language_id);
    if (language) parts.push(language.name);
    if (dataset.filters?.contribution_type) {
      parts.push(dataset.filters.contribution_type.replace(/_/g, " "));
    }
    if (dataset.filters?.minimum_quality_score !== null &&
        dataset.filters?.minimum_quality_score !== undefined) {
      parts.push(`quality ≥ ${dataset.filters.minimum_quality_score}`);
    }
    parts.push(dataset.filters?.include_synthetic ? "includes synthetic" : "human only");
    return parts.join(" · ");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin" className="text-sm font-medium text-reed">
        ← Admin
      </Link>
      <h1 className="mt-8 text-5xl font-semibold tracking-[-0.04em]">Datasets</h1>
      <p className="mt-4 text-ink/60">
        A dataset is a snapshot of approved contributions. Build one from filters, then
        generate a JSONL export to download.
      </p>

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      <section className="mt-10 rounded-3xl border border-ink/10 bg-white/50 p-6">
        <h2 className="text-xl font-semibold">Build a dataset</h2>
        <form onSubmit={create} className="mt-5 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required className={fieldClass} />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <label>
              <span className="text-sm font-medium">Language</span>
              <select name="language_id" className={fieldClass} defaultValue="">
                <option value="">All languages</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium">Type</span>
              <select name="contribution_type" className={fieldClass} defaultValue="">
                <option value="">All types</option>
                {CONTRIBUTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium">Minimum quality</span>
              <input
                name="minimum_quality_score"
                type="number"
                min={0}
                max={100}
                placeholder="Any"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea name="description" rows={2} className={fieldClass} />
          </label>

          <label className="flex gap-3 text-sm">
            <input name="include_synthetic" type="checkbox" className="mt-0.5" />
            <span>Include synthetic examples</span>
          </label>

          <button
            disabled={busy === "create"}
            className="rounded-full bg-reed px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {busy === "create" ? "Building…" : "Build from approved data"}
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          Datasets {datasets.length > 0 && <span className="text-ink/40">({datasets.length})</span>}
        </h2>

        {datasets.length === 0 ? (
          <p className="mt-4 text-ink/50">No datasets yet. Build one above.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {datasets.map((dataset) => {
              const datasetExports = exports
                .filter((item) => item.dataset_id === dataset.id)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

              return (
                <article
                  key={dataset.id}
                  className="rounded-3xl border border-ink/10 bg-white/60 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{dataset.name}</h3>
                      <p className="mt-1 text-sm text-ink/55">{describeFilters(dataset)}</p>
                      {dataset.description && (
                        <p className="mt-2 text-sm text-ink/70">{dataset.description}</p>
                      )}
                      <p className="mt-2 text-xs text-ink/40">
                        Created {formatDate(dataset.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy === dataset.id}
                      onClick={() => generate(dataset.id)}
                      className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {busy === dataset.id ? "Generating…" : "Generate export"}
                    </button>
                  </div>

                  {datasetExports.length > 0 && (
                    <div className="mt-5 space-y-2 border-t border-ink/10 pt-4">
                      {datasetExports.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-ink/70">
                            {item.item_count.toLocaleString()} items ·{" "}
                            {item.export_format.toUpperCase()} · {formatDate(item.created_at)}
                            {item.status !== "completed" && ` · ${item.status}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => download(item.id, dataset.name)}
                            className="font-medium text-reed"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
