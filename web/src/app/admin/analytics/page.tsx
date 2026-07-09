"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/client-api";

export default function AnalyticsPage() {
  const [data, setData] = useState<Record<string, unknown>>({});
  useEffect(() => { authenticatedFetch("/admin/analytics").then(setData); }, []);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Platform analytics</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(data).map(([label, value]) => <div key={label} className="rounded-3xl bg-white/70 p-6 ring-1 ring-ink/10"><p className="text-sm text-ink/55">{label.replaceAll("_", " ")}</p><p className="mt-2 text-4xl font-semibold">{String(value)}</p></div>)}
      </div>
    </main>
  );
}
