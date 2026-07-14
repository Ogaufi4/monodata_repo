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
  submitted_at: string | null;
  points_awarded: number;
};
type Wallet = { earned_coins: number; pending_coins: number; total_lifetime_coins: number };
type User = { full_name: string; roles: string[] };

const statusTone: Record<string, string> = {
  approved: "bg-leaf/15 text-leaf",
  submitted: "bg-sun/20 text-night",
  pending_review: "bg-sun/20 text-night",
  needs_changes: "bg-clay/10 text-clay",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-stone/10 text-stone",
};

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

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
  const totalAwarded = items.reduce((total, item) => total + item.points_awarded, 0);
  const recentItems = items.slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm font-medium text-reed">Home</Link>
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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-ink p-7 text-sand md:col-span-2">
          <p className="text-sm text-white/60">Available points</p>
          <p className="mt-2 text-5xl font-semibold text-sun">
            {wallet?.earned_coins ?? 0}
          </p>
          <p className="mt-3 text-sm text-white/55">
            Lifetime points: {wallet?.total_lifetime_coins ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white/70 p-7 ring-1 ring-ink/10">
          <p className="text-sm text-ink/55">Points from uploads</p>
          <p className="mt-2 text-5xl font-semibold">{totalAwarded}</p>
          <p className="mt-3 text-sm text-ink/55">
            Points appear after review approval.
          </p>
        </div>
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

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">Your uploads</h2>
            <p className="mt-2 text-sm text-ink/55">
              Track what you submitted, review status, and points awarded.
            </p>
          </div>
          <Link href="/submissions" className="text-sm font-semibold text-reed">
            View all submissions
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl bg-white/70 ring-1 ring-ink/10">
          {recentItems.length ? (
            <div className="divide-y divide-ink/10">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/submissions/${item.id}`}
                  className="grid gap-4 p-5 transition-colors hover:bg-white/70 md:grid-cols-[1.4fr_.8fr_.7fr_.5fr]"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm capitalize text-ink/55">
                      {pretty(item.contribution_type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-ink/45">Submitted</p>
                    <p className="mt-1 text-sm">
                      {item.submitted_at
                        ? new Date(item.submitted_at).toLocaleDateString()
                        : "Not submitted"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-ink/45">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusTone[item.status] ?? "bg-sand text-ink"
                      }`}
                    >
                      {pretty(item.status)}
                    </span>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs font-medium uppercase text-ink/45">Points</p>
                    <p className="mt-1 text-2xl font-semibold text-reed">
                      {item.points_awarded}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-ink/55">No uploads yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
