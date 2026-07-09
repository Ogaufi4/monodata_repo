"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/client-api";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Record<string, number> | null>(null);
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    Promise.all([authenticatedFetch("/wallet"), authenticatedFetch("/wallet/transactions")])
      .then(([value, history]) => { setWallet(value); setTransactions(history); });
  }, []);
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-reed">← Dashboard</Link>
      <h1 className="mt-12 text-5xl font-semibold">Wallet</h1>
      <div className="mt-10 rounded-3xl bg-ink p-8 text-sand">
        <p className="text-white/60">Earned coins</p>
        <p className="mt-2 text-6xl font-semibold text-sun">{wallet?.earned_coins ?? 0}</p>
      </div>
      <h2 className="mt-10 text-2xl font-semibold">Transactions</h2>
      <div className="mt-4 space-y-3">
        {transactions.map((transaction) => (
          <div key={String(transaction.id)} className="flex justify-between rounded-2xl bg-white/70 p-5">
            <span>{String(transaction.reason)}</span>
            <strong>+{String(transaction.amount)}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
