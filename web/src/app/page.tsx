"use client";

import { useState } from "react";

import { AudioTile, LabelTile, TranslationTile } from "@/components/data-tiles";
import { ScrollTop } from "@/components/scroll-top";
import { SiteNav } from "@/components/site-nav";

const audiences = [
  {
    title: "Community members",
    detail:
      "Contribute the words, voices, and stories of your language, keep control of consent, and earn coins for every approved item.",
  },
  {
    title: "Language custodians",
    detail:
      "Review submissions, protect dialect detail, and keep community context attached to everything that enters a dataset.",
  },
  {
    title: "Researchers and AI teams",
    detail:
      "Work from structured, human-reviewed data with provenance, review status, consent, and export manifests included.",
  },
];

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

const workflow = [
  "Register as a contributor, reviewer, or administrator.",
  "Select the language, dialect, speech community, and contribution type.",
  "Upload text, audio, image, video, document, or conversation data.",
  "Confirm consent, open-release permissions, and attribution.",
  "Reviewers approve, request changes, or reject with reasons.",
  "Approved data earns coins and is exported into trusted datasets.",
];

const testimonials = [
  {
    quote:
      "I recorded my grandmother's proverbs on my phone during a weekend visit. They are now part of a reviewed dataset instead of being lost with her generation.",
    author: "Kabo M.",
  },
  {
    quote:
      "As a reviewer I can finally protect dialect detail. Nothing reaches a dataset before someone who speaks the language has looked at it.",
    author: "Neo T.",
  },
  {
    quote:
      "The consent record travels with every item. That is the difference between data we can publish and data we cannot touch.",
    author: "Dr. Lorato S.",
  },
  {
    quote:
      "Coins for approved contributions turned this into something my whole village wanted to take part in.",
    author: "Thato K.",
  },
  {
    quote:
      "We pulled an export manifest and had a clean training set the same afternoon. Provenance was already attached.",
    author: "Amogelang R.",
  },
];

const stats = [
  ["10+", "data types supported"],
  ["All", "Botswana languages and dialects"],
  ["Human", "review before release"],
  ["Ready", "for research, policy, and AI"],
];

const tiles = [<TranslationTile key="t" />, <AudioTile key="a" />, <LabelTile key="l" />];

/** Overlapping frames, mirroring the offset-collage rhythm of the hero. */
const slots = [
  "absolute bottom-12 left-0 z-20 h-[300px] w-[62%] overflow-hidden border-[10px] border-white shadow-2xl shadow-night/20 sm:h-[360px]",
  "absolute right-0 top-0 z-10 hidden h-[280px] w-[52%] overflow-hidden border-[10px] border-white shadow-xl shadow-night/10 sm:block sm:h-[320px]",
  "absolute bottom-0 right-[6%] z-30 hidden h-[190px] w-[190px] overflow-hidden border-4 border-clay shadow-xl shadow-night/20 sm:block",
];

export default function Home() {
  const [front, setFront] = useState(0);
  const [quote, setQuote] = useState(0);

  const rotate = (step: number) =>
    setFront((value) => (value + step + tiles.length) % tiles.length);
  const move = (step: number) =>
    setQuote((value) => (value + step + testimonials.length) % testimonials.length);

  return (
    <div className="overflow-hidden">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-clay">
              Botswana&apos;s languages
            </p>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-night md:text-6xl">
              Collect local language data for culture, research, and AI
            </h1>
            <div className="mt-8 h-0.5 w-48 bg-clay/60" />
            <p className="mt-8 max-w-xl text-lg leading-8 text-stone">
              Indigenous helps communities, custodians, and researchers gather,
              review, reward, and export Botswana&apos;s multimodal language data
              from one trusted source of truth.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/register"
                className="rounded-md bg-leaf px-9 py-4 font-bold text-white shadow-lg shadow-leaf/25 transition-colors hover:bg-leaf/90"
              >
                Start Contributing
              </a>
              <a
                href="#about"
                className="rounded-md bg-white px-9 py-4 font-bold text-night ring-1 ring-night/10 transition-colors hover:bg-white/70"
              >
                Learn more
              </a>
            </div>
          </div>

          <div>
            <div className="relative h-[440px] sm:h-[520px]">
              {slots.map((slot, index) => (
                <div key={slot} className={slot}>
                  {tiles[(front + index) % tiles.length]}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-6 text-clay">
              <button
                type="button"
                onClick={() => rotate(-1)}
                aria-label="Previous"
                className="transition-opacity hover:opacity-60"
              >
                <Arrow direction="left" />
              </button>
              <button
                type="button"
                onClick={() => rotate(1)}
                aria-label="Next"
                className="transition-opacity hover:opacity-60"
              >
                <Arrow direction="right" />
              </button>
            </div>
          </div>
        </section>

        {/* Who it is for */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <p className="section-label text-lg">Who Indigenous is for</p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {audiences.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl bg-shell p-9 shadow-sm ring-1 ring-night/5"
              >
                <h3 className="text-2xl font-extrabold tracking-tight text-night">
                  {item.title}
                </h3>
                <p className="mt-5 leading-8 text-stone">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="relative hidden pb-10 pl-10 lg:block">
              <span className="absolute left-0 top-0 h-[78%] w-[78%] border-2 border-clay" />
              <div className="relative ml-16 mt-16 grid gap-4 rounded-sm bg-night p-10 text-white shadow-2xl shadow-night/25">
                {stats.map(([value, label]) => (
                  <div key={label} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                    <p className="text-3xl font-extrabold">{value}</p>
                    <p className="mt-1 text-sm text-white/60">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="section-label">About us</p>
              <h2 className="mt-8 text-5xl font-extrabold tracking-tight text-night">
                Indigenous
              </h2>
              <p className="mt-8 text-lg leading-9 text-stone">
                Indigenous is a national data platform for Botswana&apos;s
                languages. We believe language preservation and responsible
                African AI should grow from the same reviewed, consented source
                of truth.
              </p>
              <p className="mt-6 text-lg leading-9 text-stone">
                Every approved item keeps its language metadata, source context,
                consent record, review status, and dataset eligibility attached,
                so communities stay visible in the systems built on their
                knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* What you can contribute */}
        <section id="datasets" className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="section-label">What we do best</p>
              <h2 className="mt-8 text-5xl font-extrabold tracking-tight text-night">
                What you can contribute
              </h2>
              <p className="mt-8 text-lg leading-9 text-stone">
                Multimodal data that reflects real language life, from a single
                translated phrase to a recorded story, reviewed by people who
                speak the language.
              </p>
              <a
                href="/contribute"
                className="mt-10 inline-block rounded-md bg-leaf px-9 py-4 font-bold text-white shadow-lg shadow-leaf/25 transition-colors hover:bg-leaf/90"
              >
                View all types
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contributionTypes.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl bg-shell p-6 ring-1 ring-night/5 transition-shadow hover:shadow-lg hover:shadow-night/5"
                >
                  <h3 className="text-lg font-extrabold text-night">{item.title}</h3>
                  <p className="mt-3 leading-7 text-stone">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-shell">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="section-label">How it works</p>
              <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-night md:text-5xl">
                From contribution to dataset, accountable at every step
              </h2>
              <p className="mt-8 text-lg leading-9 text-stone">
                Items move from draft to submitted, reviewed, rewarded, and
                exported without ever losing their language or consent metadata.
              </p>
            </div>
            <ol className="space-y-4">
              {workflow.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[3rem_1fr] items-center gap-5 rounded-2xl bg-white p-5 ring-1 ring-night/5"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-clay/10 font-extrabold text-clay">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-7 text-stone">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <p className="section-label">What they say</p>
          <h2 className="mt-8 text-5xl font-extrabold tracking-tight text-night">
            From the community
          </h2>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <blockquote className="relative">
              <span
                aria-hidden="true"
                className="block text-7xl font-extrabold leading-none text-clay/20"
              >
                &ldquo;
              </span>
              <p className="mt-2 text-2xl font-bold leading-10 text-night">
                {testimonials[quote].quote}
              </p>
              <footer className="mt-8 text-lg font-extrabold text-night">
                ~ {testimonials[quote].author}
              </footer>

              <div className="mt-10 flex items-center gap-8">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous testimonial"
                  className="text-night transition-opacity hover:opacity-60"
                >
                  <Arrow direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next testimonial"
                  className="text-night transition-opacity hover:opacity-60"
                >
                  <Arrow direction="right" />
                </button>
                <div className="flex gap-3">
                  {testimonials.map((item, index) => (
                    <button
                      key={item.author}
                      type="button"
                      onClick={() => setQuote(index)}
                      aria-label={`Testimonial ${index + 1}`}
                      aria-current={index === quote}
                      className={`h-4 w-4 rounded-full border-2 border-clay transition-colors ${
                        index === quote ? "bg-clay" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </blockquote>

            <div className="relative hidden h-[380px] lg:block">
              <div className="absolute inset-0 overflow-hidden border-[10px] border-white shadow-2xl shadow-night/15">
                <TranslationTile />
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-night text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sun">
                Build the national data foundation
              </p>
              <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Start collecting trusted indigenous data today
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
                Contributors can begin submitting immediately, while
                administrators manage languages, reviews, datasets, rewards, and
                analytics.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <a
                href="/register"
                className="rounded-md bg-leaf px-9 py-4 font-bold text-white transition-colors hover:bg-leaf/90"
              >
                Join the platform
              </a>
              <a
                href="/leaderboard"
                className="rounded-md px-9 py-4 font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/5"
              >
                View leaderboard
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-night/10 bg-shell">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-stone">
          <p className="font-semibold text-night">Indigenous &middot; Botswana</p>
          <p>Contribute. Review. Preserve.</p>
        </div>
      </footer>

      <ScrollTop />
    </div>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "left" ? "M39 12H1m8-8l-8 8 8 8" : "M1 12h38m-8-8l8 8-8 8"}
      />
    </svg>
  );
}
