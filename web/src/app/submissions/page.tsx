"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/client-api";

type Contribution = {
  id: string;
  title: string;
  contribution_type: string;
  status: string;
  created_at: string;
};

export default function SubmissionsPage() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    authenticatedFetch("/contributions").then(setItems).catch((caught) => setError(caught.message));
  }, []);
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-reed">← Dashboard</Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">Your submissions</h1>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/submissions/${item.id}`}
            className="flex items-center justify-between rounded-2xl bg-white/70 p-5 ring-1 ring-ink/10"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-ink/55">{item.contribution_type.replaceAll("_", " ")}</p>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-sm">{item.status.replaceAll("_", " ")}</span>
          </Link>
        ))}
        {!items.length && !error && <p className="text-ink/55">No submissions yet.</p>}
      </div>
    </main>
  );
}
