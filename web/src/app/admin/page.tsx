import Link from "next/link";

const tools = [
  ["/admin/reviews", "Review queue", "Approve, reject, or request contributor changes."],
  ["/admin/languages", "Languages & categories", "Manage the contribution taxonomy."],
  ["/admin/synthetic", "Synthetic guidance", "Create and human-verify guidance examples."],
  ["/admin/datasets", "Dataset builder", "Filter approved data and generate JSONL exports."],
  ["/admin/analytics", "Analytics", "Track contributions, rewards, labels, and exports."],
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-5xl font-semibold">Administration</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {tools.map(([href, title, description]) => (
          <Link key={href} href={href} className="rounded-3xl bg-white/70 p-7 ring-1 ring-ink/10">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-ink/60">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
