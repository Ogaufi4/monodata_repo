"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

type Entry = { rank: number; full_name: string; coins: number };

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load leaderboard.");
        return response.json();
      })
      .then(setEntries)
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
        Contributor points
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
        Community leaderboard
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink/60">
        Rankings update from approved uploads and lifetime points.
      </p>

      {error && <p className="mt-8 text-red-700">{error}</p>}
      {loading && <p className="mt-8 text-ink/55">Loading leaderboard...</p>}

      <div className="mt-10 overflow-hidden rounded-3xl bg-white/70 ring-1 ring-ink/10">
        {entries.map((entry) => (
          <div
            key={`${entry.rank}-${entry.full_name}`}
            className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-ink/10 p-5 last:border-0"
          >
            <strong className="text-xl">#{entry.rank}</strong>
            <span className="font-semibold">{entry.full_name}</span>
            <span className="rounded-full bg-sun/20 px-4 py-2 font-semibold text-ink">
              {entry.coins} points
            </span>
          </div>
        ))}
        {!loading && !error && !entries.length && (
          <div className="p-8 text-ink/55">
            No approved points yet. Approved uploads will appear here.
          </div>
        )}
      </div>
    </main>
  );
}
