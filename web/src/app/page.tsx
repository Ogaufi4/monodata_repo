const contributionTypes = [
  {
    title: "Translations",
    detail: "Parallel text for local language pairs, public services, education, and AI training.",
  },
  {
    title: "Conversations",
    detail: "Natural dialogues that capture greetings, idioms, context, and everyday usage.",
  },
  {
    title: "Voice recordings",
    detail: "Pronunciation, speech variation, accents, and oral knowledge linked to consent.",
  },
  {
    title: "Images and labels",
    detail: "Object labels, captions, bounding boxes, and visual context from Botswana communities.",
  },
  {
    title: "Videos and stories",
    detail: "Cultural demonstrations, narratives, and multimodal records for future research.",
  },
  {
    title: "Documents",
    detail: "Scanned or uploaded records that can be cleaned, reviewed, and prepared for datasets.",
  },
];

const stakeholderBenefits = [
  {
    audience: "Community members",
    value:
      "Earn coins for approved contributions, track submissions, and help protect language knowledge with clear consent choices.",
  },
  {
    audience: "Language custodians",
    value:
      "Review contributions, preserve dialect detail, and keep community context attached to every approved item.",
  },
  {
    audience: "Researchers and AI teams",
    value:
      "Access cleaner, structured datasets with provenance, review status, usage consent, and export manifests.",
  },
  {
    audience: "Government and funders",
    value:
      "See measurable progress across languages, contribution types, review pipelines, rewards, and dataset readiness.",
  },
];

const workflow = [
  "Register a contributor, reviewer, or administrator account.",
  "Select the language, dialect, speech community, and contribution type.",
  "Upload or create text, audio, image, video, document, or conversation data.",
  "Confirm consent, open-release permissions, and attribution preferences.",
  "Reviewers approve, request changes, or reject submissions with reasons.",
  "Approved data earns coins and can be exported into trusted datasets.",
];

const platformStats = [
  ["10+", "data types supported"],
  ["All", "Botswana languages and dialects"],
  ["Human", "review before dataset release"],
  ["Ready", "for research, policy, and AI"],
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="font-semibold tracking-tight">
          Indigenous Intelligence
        </a>
        <div className="flex items-center gap-2">
          <a
            href="/contribute"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink/75 ring-1 ring-ink/10 sm:inline-flex"
          >
            Contribute
          </a>
          <a
            href="/login"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white"
          >
            Sign in
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 md:grid-cols-[1.1fr_.9fr] md:items-center md:pb-28 md:pt-24">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-reed">
            Botswana Indigenous Intelligence Data Platform
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">
            A trusted home for Botswana&apos;s languages, culture, and AI-ready knowledge.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72">
            The platform helps communities collect, review, reward, and export
            multimodal indigenous data so language preservation and responsible
            African AI can grow from the same source of truth.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/register"
              className="rounded-full bg-reed px-6 py-3 font-medium text-white shadow-lg shadow-reed/20"
            >
              Create an account
            </a>
            <a
              href="/contribute"
              className="rounded-full bg-white px-6 py-3 font-medium ring-1 ring-ink/10"
            >
              Start contributing
            </a>
          </div>
        </div>

        <aside className="rounded-2xl bg-ink p-7 text-sand shadow-2xl shadow-ink/15">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sun">
            What the platform delivers
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {platformStats.map(([value, label]) => (
              <div key={label} className="border-t border-white/10 pt-4">
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg bg-white/7 p-5 ring-1 ring-white/10">
            <p className="text-sm font-medium text-sun">Core mission</p>
            <p className="mt-3 leading-7 text-white/76">
              Build community-reviewed datasets that preserve indigenous
              knowledge, respect contributor consent, and make Botswana visible
              in the next generation of digital and AI systems.
            </p>
          </div>
        </aside>
      </section>

      <section className="border-y border-ink/10 bg-white/45">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
              Mission
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Preserve language knowledge through everyday contribution.
            </h2>
            <p className="mt-5 leading-7 text-ink/68">
              The mission is to give people a practical way to contribute the
              words, voices, labels, stories, and records that represent their
              communities, then review that data before it enters any dataset.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
              Vision
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Botswana-owned data infrastructure for inclusive AI.
            </h2>
            <p className="mt-5 leading-7 text-ink/68">
              The vision is a national-grade repository where all Botswana
              languages, dialects, and speech communities can be represented in
              education, research, public services, and AI products.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
              Promise
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Consent, review, rewards, and export-ready structure.
            </h2>
            <p className="mt-5 leading-7 text-ink/68">
              Every approved item keeps its language metadata, source context,
              consent record, review status, and dataset eligibility attached.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
            What people can contribute
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Multimodal data that reflects real language life.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contributionTypes.map((item) => (
            <article
              key={item.title}
              className="rounded-lg bg-white/70 p-6 ring-1 ring-ink/10"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-4 leading-7 text-ink/66">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#ecf1ed]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
              Stakeholder value
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Clear benefits for contributors, custodians, researchers, and sponsors.
            </h2>
            <p className="mt-6 leading-7 text-ink/68">
              The platform is designed to satisfy community participation,
              governance, operational reporting, and dataset delivery in one
              workflow.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {stakeholderBenefits.map((benefit) => (
              <article
                key={benefit.audience}
                className="rounded-lg bg-white p-6 ring-1 ring-ink/10"
              >
                <h3 className="text-lg font-semibold">{benefit.audience}</h3>
                <p className="mt-4 leading-7 text-ink/66">{benefit.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reed">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            From contribution to dataset, with accountability at each step.
          </h2>
          <p className="mt-6 leading-7 text-ink/68">
            The workflow keeps the platform contribution-centric: every item can
            move from draft to submitted, reviewed, rewarded, and exported
            without losing its language or consent metadata.
          </p>
        </div>
        <ol className="space-y-3">
          {workflow.map((step, index) => (
            <li
              key={step}
              className="grid grid-cols-[3rem_1fr] items-start gap-4 rounded-lg bg-white/70 p-5 ring-1 ring-ink/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun/20 text-sm font-semibold text-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="leading-7 text-ink/74">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-ink/10 bg-ink text-sand">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sun">
              Build the national data foundation
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
              Start collecting trusted indigenous data today.
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-white/66">
              Contributors can begin submitting data, while administrators can
              manage languages, reviews, datasets, rewards, and analytics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href="/register"
              className="rounded-full bg-sun px-6 py-3 font-medium text-ink"
            >
              Join the platform
            </a>
            <a
              href="/leaderboard"
              className="rounded-full px-6 py-3 font-medium text-white ring-1 ring-white/18"
            >
              View leaderboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
