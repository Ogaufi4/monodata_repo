"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { type Language } from "@/lib/api";
import {
  apiPost,
  authToken,
  derivedMetadata,
  fieldClass,
  loadList,
  nextPrompt,
  STANDARD_CONSENT,
  type Category,
  type GuidedPrompt,
} from "@/lib/guided";

type Turn = { speaker_label: string; source_text: string };

const startingTurns = (): Turn[] => [
  { speaker_label: "Speaker A", source_text: "" },
  { speaker_label: "Speaker B", source_text: "" },
];

export default function ConversationPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("");
  const [prompt, setPrompt] = useState<GuidedPrompt | null>(null);
  const [turns, setTurns] = useState<Turn[]>(startingTurns());
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);

  useEffect(() => {
    Promise.all([loadList<Language>("/languages"), loadList<Category>("/categories")])
      .then(([languageData, categoryData]) => {
        setLanguages(languageData);
        setCategories(categoryData);
      })
      .catch(() => setNotice({ text: "Could not load the language list.", isError: true }));
  }, []);

  const loadPrompt = useCallback(async (languageId: string) => {
    const token = authToken();
    if (!token) {
      setNotice({ text: "Sign in to start recording conversations.", isError: true });
      return;
    }
    setPromptLoading(true);
    setNotice(null);
    try {
      const result = await nextPrompt(token, languageId, "conversation");
      if (!result.prompt) {
        setPrompt(null);
        setNotice({
          text: result.detail || "No conversation topics are left for this language.",
          isError: false,
        });
        return;
      }
      setPrompt(result.prompt);
      setTurns(startingTurns());
    } catch (caught) {
      setNotice({
        text: caught instanceof Error ? caught.message : "Could not load a topic",
        isError: true,
      });
    } finally {
      setPromptLoading(false);
    }
  }, []);

  function chooseLanguage(languageId: string) {
    setLanguage(languageId);
    setPrompt(null);
    setTurns(startingTurns());
    setNotice(null);
    if (languageId) void loadPrompt(languageId);
  }

  function updateTurn(index: number, value: string) {
    setTurns((current) =>
      current.map((turn, turnIndex) =>
        turnIndex === index ? { ...turn, source_text: value } : turn,
      ),
    );
  }

  const filledTurns = turns.filter((turn) => turn.source_text.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = authToken();
    if (!token || !prompt || !language) return;

    setLoading(true);
    setNotice(null);
    try {
      const languageName =
        languages.find((item) => item.id === language)?.name ?? "the language";
      const meta = derivedMetadata(prompt, languageName, categories, "conversation");

      const draft = await apiPost("/contributions", token, {
        contribution_type: "conversation",
        language_id: language,
        source_prompt_id: prompt.id,
        ...meta,
      });

      const conversation = await apiPost("/conversations", token, {
        contribution_id: draft.id,
        speaker_count: new Set(filledTurns.map((turn) => turn.speaker_label)).size,
        context: prompt.source_text,
      });

      for (const [index, turn] of filledTurns.entries()) {
        await apiPost(`/conversations/${conversation.id}/turns`, token, {
          turn_order: index + 1,
          speaker_label: turn.speaker_label,
          source_text: turn.source_text.trim(),
        });
      }

      await apiPost(`/contributions/${draft.id}/consent`, token, STANDARD_CONSENT);
      await apiPost(`/contributions/${draft.id}/submit`, token);

      setNotice({ text: "Saved. Here is the next topic.", isError: false });
      await loadPrompt(language);
    } catch (caught) {
      setNotice({
        text: caught instanceof Error ? caught.message : "Submission failed",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/contribute" className="text-sm font-medium text-reed">
        ← Contribution types
      </Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">Record a conversation</h1>
      <p className="mt-4 text-ink/60">
        Pick your language, read the situation, then write what each person would say in your
        language. Everything else is filled in for you.
      </p>

      <div className="mt-10">
        <label className="block">
          <span className="text-sm font-medium">The conversation is in</span>
          <select
            required
            className={fieldClass}
            value={language}
            onChange={(event) => chooseLanguage(event.target.value)}
          >
            <option value="">Select your language</option>
            {languages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.local_name || item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <p className={`mt-5 text-sm ${notice.isError ? "text-red-700" : "text-reed"}`}>
          {notice.text}
        </p>
      )}

      {language && (
        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl border border-ink/10 bg-white/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium text-ink/60">The situation</span>
              <button
                type="button"
                disabled={promptLoading || loading}
                onClick={() => loadPrompt(language)}
                className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {promptLoading ? "Loading…" : "Skip"}
              </button>
            </div>
            {prompt ? (
              <>
                <p className="mt-4 text-2xl font-semibold leading-snug">{prompt.source_text}</p>
                <p className="mt-3 text-sm text-ink/55">
                  {prompt.domain.replace(/_/g, " ")}
                  {typeof prompt.remaining_count === "number"
                    ? ` · ${prompt.remaining_count} people still needed`
                    : ""}
                </p>
              </>
            ) : (
              <p className="mt-4 text-ink/50">
                {promptLoading ? "Finding a topic…" : "No topic loaded."}
              </p>
            )}
          </section>

          {prompt && (
            <>
              <div className="space-y-4">
                {turns.map((turn, index) => (
                  <label key={index} className="block">
                    <span className="text-sm font-medium">{turn.speaker_label} says</span>
                    <textarea
                      rows={2}
                      required={index < 2}
                      className={fieldClass}
                      value={turn.source_text}
                      onChange={(event) => updateTurn(index, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setTurns((current) => [
                    ...current,
                    {
                      speaker_label: current.length % 2 === 0 ? "Speaker A" : "Speaker B",
                      source_text: "",
                    },
                  ])
                }
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium"
              >
                Add another line
              </button>

              <label className="flex gap-3 text-sm">
                <input type="checkbox" required className="mt-0.5" />
                <span>
                  I agree this may be stored, reviewed, and used for research and responsible
                  AI training, with attribution and open release. Commercial use is not
                  granted.
                </span>
              </label>

              <button
                disabled={loading || promptLoading || filledTurns.length < 2}
                className="w-full rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving…" : "Submit and get next topic"}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  );
}
