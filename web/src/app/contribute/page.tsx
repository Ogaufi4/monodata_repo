import Link from "next/link";

import { getLanguages } from "@/lib/api";

const paths = [
  {
    title: "Translate text",
    description: "Create a source and target language pair.",
    href: "/contribute/translation",
  },
  {
    title: "Build a conversation",
    description: "Add a natural dialogue with multiple speakers and turns.",
    href: "/contribute/conversation",
  },
  {
    title: "Record your voice",
    description: "Connect pronunciation and speech to written language.",
    href: "/contribute/audio",
  },
  {
    title: "Share cultural knowledge",
    description: "Preserve a story, proverb, practice, image, or document.",
    href: "/contribute/text",
  },
];

export default async function ContributePage() {
  const languages = await getLanguages();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm font-medium text-reed">
        ← Home
      </Link>
      <div className="mt-14 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-reed">
          Make a contribution
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          What would you like to preserve today?
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink/65">
          Every submission stays linked to its language, community, consent,
          and review history.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {paths.map((path, index) => (
          <Link
            href={path.href}
            key={path.title}
            className="group rounded-3xl bg-white/70 p-7 ring-1 ring-ink/10 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10"
          >
            <span className="text-sm text-reed">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-8 text-2xl font-semibold">{path.title}</h2>
            <p className="mt-2 text-ink/60">{path.description}</p>
          </Link>
        ))}
      </div>

      <section className="mt-14 rounded-3xl bg-ink p-7 text-sand">
        <p className="text-sm uppercase tracking-[0.18em] text-sun">
          Available language taxonomy
        </p>
        {languages.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {languages.map((language) => (
              <span
                key={language.id}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                {language.local_name || language.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-white/65">
            No languages have been published yet. An administrator can add the
            first taxonomy entries through the API.
          </p>
        )}
      </section>
    </main>
  );
}
