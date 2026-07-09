"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/client-api";

type Contribution = { id: string; title: string; contribution_type: string; status: string };
type Wallet = { earned_coins: number; total_lifetime_coins: number };
type User = { full_name: string; roles: string[] };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Contribution[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      authenticatedFetch("/auth/me"),
      authenticatedFetch("/contributions"),
      authenticatedFetch("/wallet"),
    ])
      .then(([profile, contributions, walletData]) => {
        setUser(profile);
        setItems(contributions);
        setWallet(walletData);
      })
      .catch((caught) => setError(caught.message));
  }, []);

  const approved = items.filter((item) => item.status === "approved").length;
  const pending = items.filter((item) =>
    ["submitted", "pending_review"].includes(item.status),
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm font-medium text-reed">← Home</Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">
        {user ? `${user.full_name}'s dashboard` : "Contributor dashboard"}
      </h1>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Contributions", items.length],
          ["Awaiting review", pending],
          ["Approved", approved],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white/70 p-6 ring-1 ring-ink/10">
            <p className="text-sm text-ink/55">{label}</p>
            <p className="mt-2 text-4xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-ink p-7 text-sand">
        <p className="text-sm text-white/60">Earned coins</p>
        <p className="mt-2 text-4xl font-semibold text-sun">
          {wallet?.earned_coins ?? 0}
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/contribute" className="rounded-full bg-reed px-6 py-3 text-white">
          New contribution
        </Link>
        <Link href="/submissions" className="rounded-full bg-white px-6 py-3 ring-1 ring-ink/10">
          View submissions
        </Link>
        {user?.roles.some((role) => ["reviewer", "admin", "super_admin"].includes(role)) && (
          <Link href="/admin/reviews" className="rounded-full bg-white px-6 py-3 ring-1 ring-ink/10">
            Review queue
          </Link>
        )}
        {user?.roles.some((role) => ["admin", "super_admin"].includes(role)) && (
          <Link href="/admin" className="rounded-full bg-sun px-6 py-3">
            Admin console
          </Link>
        )}
      </div>
    </main>
  );
}
