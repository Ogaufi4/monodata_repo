"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/client-api";

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [assets, setAssets] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/contributions/${id}`),
      authenticatedFetch(`/contributions/${id}/assets`),
    ]).then(([contribution, contributionAssets]) => {
      setItem(contribution);
      setAssets(contributionAssets);
    }).catch((caught) => setError(caught.message));
  }, [id]);
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/submissions" className="text-sm font-medium text-reed">← Submissions</Link>
      {error && <p className="mt-8 text-red-700">{error}</p>}
      {item && (
        <>
          <div className="mt-12 flex items-start justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em]">{String(item.title)}</h1>
            <span className="rounded-full bg-white px-4 py-2 text-sm ring-1 ring-ink/10">
              {String(item.status).replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-5 leading-7 text-ink/65">{String(item.description)}</p>
          <dl className="mt-8 grid gap-4 rounded-3xl bg-white/60 p-6 sm:grid-cols-2">
            {["contribution_type", "domain", "license_type", "created_at", "submitted_at", "quality_score"].map((key) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-wider text-ink/45">{key.replaceAll("_", " ")}</dt>
                <dd className="mt-1">{item[key] == null ? "—" : String(item[key])}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-10 text-2xl font-semibold">Assets ({assets.length})</h2>
        </>
      )}
    </main>
  );
}
