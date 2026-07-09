"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { API_URL, type Language } from "@/lib/api";

type Category = { id: string; name: string };
type Turn = {
  speaker_label: string;
  speaker_role: string;
  source_text: string;
  target_text: string;
};

const emptyTurn = (): Turn => ({
  speaker_label: "",
  speaker_role: "",
  source_text: "",
  target_text: "",
});

export default function ConversationPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [turns, setTurns] = useState<Turn[]>([emptyTurn(), emptyTurn()]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/languages`).then((response) => response.json()),
      fetch(`${API_URL}/categories`).then((response) => response.json()),
    ])
      .then(([languageData, categoryData]) => {
        setLanguages(languageData);
        setCategories(categoryData);
      })
      .catch(() => setError("Could not load the language taxonomy."));
  }, []);

  function updateTurn(index: number, field: keyof Turn, value: string) {
    setTurns((current) =>
      current.map((turn, turnIndex) =>
        turnIndex === index ? { ...turn, [field]: value } : turn,
      ),
    );
  }

  async function request(path: string, token: string, body?: object) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      const detail =
        typeof result.detail === "string"
          ? result.detail
          : result.detail?.message || "Submission failed";
      throw new Error(detail);
    }
    return result;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const token = localStorage.getItem("biidp_access_token");
    if (!token) {
      setError("Sign in before submitting a conversation.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(formElement);

    try {
      const draft = await request("/contributions", token, {
        contribution_type: "conversation",
        title: String(form.get("title")),
        description: String(form.get("description")),
        language_id: String(form.get("language_id")),
        target_language_id: form.get("target_language_id") || null,
        category_id: String(form.get("category_id")),
        domain: String(form.get("domain")),
        tags: [],
        source: "Contributor knowledge",
        license_type: String(form.get("license_type")),
      });
      const conversation = await request("/conversations", token, {
        contribution_id: draft.id,
        speaker_count: new Set(turns.map((turn) => turn.speaker_label)).size,
        context: String(form.get("context")) || null,
      });
      for (const [index, turn] of turns.entries()) {
        await request(`/conversations/${conversation.id}/turns`, token, {
          turn_order: index + 1,
          speaker_label: turn.speaker_label,
          speaker_role: turn.speaker_role || null,
          source_text: turn.source_text,
          target_text: turn.target_text || null,
        });
      }
      await request(`/contributions/${draft.id}/consent`, token, {
        consent_version: "1.0",
        use_for_ai_training: form.get("use_for_ai_training") === "on",
        use_for_research: form.get("use_for_research") === "on",
        use_for_commercial: form.get("use_for_commercial") === "on",
        allow_open_release: form.get("allow_open_release") === "on",
        allow_attribution: form.get("allow_attribution") === "on",
      });
      await request(`/contributions/${draft.id}/submit`, token);
      formElement.reset();
      setTurns([emptyTurn(), emptyTurn()]);
      setMessage("Conversation submitted for review. Thank you.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/contribute" className="text-sm font-medium text-reed">
        ← Contribution types
      </Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">
        Build a conversation
      </h1>
      <p className="mt-4 text-ink/60">
        Capture a natural dialogue turn by turn. Speaker labels can be names,
        roles, or anonymous labels such as Speaker A.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Conversation title</span>
            <input name="title" required className={fieldClass} />
          </label>
          <label>
            <span className="text-sm font-medium">Domain</span>
            <input name="domain" required className={fieldClass} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea name="description" required className={fieldClass} />
        </label>
        <div className="grid gap-5 md:grid-cols-3">
          <label>
            <span className="text-sm font-medium">Source language</span>
            <select name="language_id" required className={fieldClass}>
              <option value="">Select language</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.local_name || language.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Target language</span>
            <select name="target_language_id" className={fieldClass}>
              <option value="">No translation</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.local_name || language.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Category</span>
            <select name="category_id" required className={fieldClass}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Conversation context</span>
          <textarea name="context" className={fieldClass} />
        </label>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Dialogue turns</h2>
            <button
              type="button"
              onClick={() => setTurns((current) => [...current, emptyTurn()])}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium"
            >
              Add turn
            </button>
          </div>
          {turns.map((turn, index) => (
            <div key={index} className="rounded-3xl bg-white/60 p-6 ring-1 ring-ink/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Turn {index + 1}</h3>
                {turns.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setTurns((current) =>
                        current.filter((_, turnIndex) => turnIndex !== index),
                      )
                    }
                    className="text-sm text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={turn.speaker_label}
                  onChange={(event) =>
                    updateTurn(index, "speaker_label", event.target.value)
                  }
                  required
                  placeholder="Speaker label"
                  className={fieldClass}
                />
                <input
                  value={turn.speaker_role}
                  onChange={(event) =>
                    updateTurn(index, "speaker_role", event.target.value)
                  }
                  placeholder="Speaker role (optional)"
                  className={fieldClass}
                />
                <textarea
                  value={turn.source_text}
                  onChange={(event) =>
                    updateTurn(index, "source_text", event.target.value)
                  }
                  required
                  placeholder="Source text"
                  className={fieldClass}
                />
                <textarea
                  value={turn.target_text}
                  onChange={(event) =>
                    updateTurn(index, "target_text", event.target.value)
                  }
                  placeholder="Translation (optional)"
                  className={fieldClass}
                />
              </div>
            </div>
          ))}
        </section>

        <label className="block">
          <span className="text-sm font-medium">License</span>
          <select name="license_type" required className={fieldClass}>
            <option value="CC BY 4.0">CC BY 4.0</option>
            <option value="CC BY-NC 4.0">CC BY-NC 4.0</option>
          </select>
        </label>
        <fieldset className="rounded-3xl border border-ink/10 bg-white/50 p-6">
          <legend className="px-2 font-semibold">Consent</legend>
          <div className="space-y-3 text-sm">
            <label className="flex gap-3 font-medium">
              <input type="checkbox" required />
              <span>I consent to storage and review of this contribution</span>
            </label>
            {[
              ["use_for_ai_training", "Use for responsible AI training"],
              ["use_for_research", "Use for research"],
              ["use_for_commercial", "Allow commercial use"],
              ["allow_open_release", "Allow inclusion in open datasets"],
              ["allow_attribution", "Allow contributor attribution"],
            ].map(([name, label]) => (
              <label key={name} className="flex gap-3">
                <input name={name} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm font-medium text-reed">{message}</p>}
        <button
          disabled={loading || !languages.length || !categories.length}
          className="rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit conversation"}
        </button>
      </form>
    </main>
  );
}
