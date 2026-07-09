"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Entry = { rank: number; full_name: string; coins: number };
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => { fetch(`${API_URL}/leaderboard`).then((response) => response.json()).then(setEntries); }, []);
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-5xl font-semibold">Community leaderboard</h1>
      <div className="mt-10 space-y-3">
        {entries.map((entry) => (
          <div key={entry.rank} className="grid grid-cols-[3rem_1fr_auto] rounded-2xl bg-white/70 p-5">
            <strong>#{entry.rank}</strong><span>{entry.full_name}</span><span>{entry.coins} coins</span>
          </div>
        ))}
      </div>
    </main>
  );
}
