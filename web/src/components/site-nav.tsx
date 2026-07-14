"use client";

import { useState } from "react";

const links = [
  { label: "Home", href: "/" },
  { label: "Contribute", href: "/contribute" },
  { label: "Datasets", href: "#datasets" },
  { label: "About us", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-night/10 bg-shell/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <a href="/" className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-night/10">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-clay" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2.5c.5 0 .9.4.9.9v3l2.1-2.1a.9.9 0 1 1 1.3 1.3l-2.1 2.1h3a.9.9 0 0 1 0 1.8h-3l2.1 2.1a.9.9 0 0 1-1.3 1.3l-2.1-2.1v3a.9.9 0 0 1-1.8 0v-3l-2.1 2.1a.9.9 0 0 1-1.3-1.3l2.1-2.1h-3a.9.9 0 0 1 0-1.8h3L7.7 5.6a.9.9 0 0 1 1.3-1.3l2.1 2.1v-3c0-.5.4-.9.9-.9Z"
              />
              <circle cx="12" cy="19.5" r="1.6" fill="currentColor" opacity=".45" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-3xl font-extrabold tracking-tight text-night">
              indigenous
            </span>
            <span className="block text-xs font-medium text-stone">
              Contribute. Review. Preserve.
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {links.map((link, index) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`text-sm font-semibold uppercase tracking-wide transition-colors hover:text-clay ${
                  index === 0 ? "text-clay" : "text-night"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-full bg-leaf px-7 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-leaf/90"
          >
            Sign in
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-night/10 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
              />
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <ul className="border-t border-night/10 px-6 pb-4 lg:hidden">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-semibold uppercase tracking-wide text-night"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
