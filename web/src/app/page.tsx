const contributionTypes = [
  "Translations",
  "Conversations",
  "Voice recordings",
  "Images & labels",
  "Stories",
  "Documents",
];

export default function Home() {
  return (
    <main>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="font-semibold tracking-tight">Indigenous Intelligence</div>
        <a
          href="/login"
          className="rounded-full border border-ink/20 px-5 py-2 text-sm font-medium"
        >
          Sign in
        </a>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-16 md:grid-cols-[1.25fr_.75fr] md:pt-28">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-reed">
            Botswana Indigenous Data Platform
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-7xl">
            Our languages carry intelligence worth preserving.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/70">
            Help build trusted, community-reviewed datasets for cultural
            preservation and responsible African AI.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/contribute"
              className="rounded-full bg-reed px-6 py-3 font-medium text-white"
            >
              Start contributing
            </a>
            <a
              href="/register"
              className="rounded-full bg-white/70 px-6 py-3 font-medium ring-1 ring-ink/10"
            >
              Create an account
            </a>
          </div>
        </div>

        <aside className="rounded-[2rem] bg-ink p-8 text-sand shadow-2xl shadow-ink/15">
          <p className="text-sm uppercase tracking-[0.18em] text-sun">
            Ways to contribute
          </p>
          <ul className="mt-7 space-y-4">
            {contributionTypes.map((type, index) => (
              <li
                key={type}
                className="flex items-center gap-4 border-b border-white/10 pb-4"
              >
                <span className="text-sm text-sun">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg">{type}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-sm leading-6 text-white/60">
            Approved contributions earn coins and help strengthen Botswana&apos;s
            language communities.
          </p>
        </aside>
      </section>
    </main>
  );
}
