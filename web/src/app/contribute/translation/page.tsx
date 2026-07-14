"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { API_URL, type Language } from "@/lib/api";

type Category = { id: string; name: string };

type WordPrompt = {
  id: string;
  source_text: string;
  domain: string;
  difficulty: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  context: string | null;
  tags?: string[];
  remaining_count?: number;
};

// Corpus domains map onto the seeded categories, so contributors never pick one.
const DOMAIN_CATEGORY: Record<string, string> = {
  daily_life: "Everyday speech",
  family: "Family",
  education: "Education",
  health: "Health",
  agriculture: "Agriculture",
  law: "Law & justice",
  government: "Government services",
  commerce: "Commerce & market",
  transport: "Transport",
  technology: "Technology",
  environment: "Environment & nature",
  culture: "Culture & heritage",
};

export default function TranslationPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [prompt, setPrompt] = useState<WordPrompt | null>(null);
  const [translation, setTranslation] = useState("");
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const english = languages.find((language) => language.name.toLowerCase() === "english");

  useEffect(() => {
    async function loadList<T>(path: string): Promise<T[]> {
      const response = await fetch(`${API_URL}${path}`);
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data)) throw new Error(path);
      return data as T[];
    }

    Promise.all([loadList<Language>("/languages"), loadList<Category>("/categories")])
      .then(([languageData, categoryData]) => {
        setLanguages(languageData);
        setCategories(categoryData);
      })
      .catch(() => setNotice({ text: "Could not load the language list.", isError: true }));
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  function attachAudio(file: File | null) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudio(file);
    setAudioUrl(file ? URL.createObjectURL(file) : "");
  }

  const loadPrompt = useCallback(
    async (languageId: string) => {
      const token = localStorage.getItem("biidp_access_token");
      if (!token) {
        setNotice({ text: "Sign in to start translating.", isError: true });
        return;
      }
      setPromptLoading(true);
      setNotice(null);
      try {
        const response = await fetch(
          `${API_URL}/word-prompts/next?language_id=${languageId}&task_type=translation`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof result.detail === "string" ? result.detail : "Could not load a word",
          );
        }
        if (!result.prompt) {
          setPrompt(null);
          setNotice({
            text: result.detail || "No words are left for this language right now.",
            isError: false,
          });
          return;
        }
        setPrompt(result.prompt);
        setTranslation("");
        attachAudio(null);
      } catch (caught) {
        setNotice({
          text: caught instanceof Error ? caught.message : "Could not load a word",
          isError: true,
        });
      } finally {
        setPromptLoading(false);
      }
    },
    // attachAudio only touches refs/state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function chooseLanguage(languageId: string) {
    setTargetLanguage(languageId);
    setPrompt(null);
    setTranslation("");
    attachAudio(null);
    setNotice(null);
    if (languageId) void loadPrompt(languageId);
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice({ text: "This browser cannot record audio.", isError: true });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType.split(";")[0] || "audio/webm";
        const extension = type === "audio/mp4" ? "m4a" : type.split("/")[1] || "webm";
        attachAudio(
          new File([new Blob(chunksRef.current, { type })], `spoken-${Date.now()}.${extension}`, {
            type,
          }),
        );
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
    } catch {
      setNotice({ text: "Microphone access was denied.", isError: true });
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function request(path: string, token: string, body?: object) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof result.detail === "string"
          ? result.detail
          : result.detail?.message || "Submission failed",
      );
    }
    return result;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("biidp_access_token");
    if (!token || !prompt || !english || !targetLanguage) return;

    setLoading(true);
    setNotice(null);
    try {
      const languageName =
        languages.find((language) => language.id === targetLanguage)?.name ?? "the language";
      const categoryName = DOMAIN_CATEGORY[prompt.domain];
      const category =
        categories.find((item) => item.name === categoryName) ?? categories[0];
      if (!category) throw new Error("No categories are configured.");

      // Everything below is derived from the prompt: the contributor only
      // supplies the translation itself.
      const draft = await request("/contributions", token, {
        contribution_type: "translation",
        title: prompt.source_text.slice(0, 200),
        description: `${languageName} translation of the English ${
          prompt.part_of_speech ?? "prompt"
        } "${prompt.source_text}".`,
        language_id: english.id,
        target_language_id: targetLanguage,
        category_id: category.id,
        source_prompt_id: prompt.id,
        domain: prompt.domain,
        tags: prompt.tags ?? [prompt.domain, prompt.difficulty],
        source: "Guided English prompt",
        license_type: "CC BY 4.0",
      });

      await request("/translations", token, {
        contribution_id: draft.id,
        source_text: prompt.source_text,
        target_text: translation.trim(),
        context: prompt.context ?? null,
      });

      if (audio) {
        const signed = await request("/uploads/signed-url", token, {
          contribution_id: draft.id,
          filename: audio.name,
          content_type: audio.type,
          file_size: audio.size,
        });
        const upload = await fetch(signed.upload_url, {
          method: "PUT",
          headers: signed.required_headers,
          body: audio,
        });
        if (!upload.ok) {
          throw new Error(`Storage rejected the recording (${upload.status}).`);
        }
        await request("/uploads/confirm", token, { upload_token: signed.upload_token });
      }

      await request(`/contributions/${draft.id}/consent`, token, {
        consent_version: "1.0",
        use_for_ai_training: true,
        use_for_research: true,
        use_for_commercial: false,
        allow_open_release: true,
        allow_attribution: true,
      });
      await request(`/contributions/${draft.id}/submit`, token);

      setNotice({ text: "Saved. Here is the next word.", isError: false });
      await loadPrompt(targetLanguage);
    } catch (caught) {
      setNotice({
        text: caught instanceof Error ? caught.message : "Submission failed",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/contribute" className="text-sm font-medium text-reed">
        ← Contribution types
      </Link>
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">Translate a word</h1>
      <p className="mt-4 text-ink/60">
        Pick your language, read the English prompt, and write it in your language. You can
        speak it too. Everything else is filled in for you.
      </p>

      <div className="mt-10">
        <label className="block">
          <span className="text-sm font-medium">I am translating into</span>
          <select
            required
            className={fieldClass}
            value={targetLanguage}
            onChange={(event) => chooseLanguage(event.target.value)}
          >
            <option value="">Select your language</option>
            {languages
              .filter((language) => language.id !== english?.id)
              .map((language) => (
                <option key={language.id} value={language.id}>
                  {language.local_name || language.name}
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

      {targetLanguage && (
        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl border border-ink/10 bg-white/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium text-ink/60">English prompt</span>
              <button
                type="button"
                disabled={promptLoading || loading}
                onClick={() => loadPrompt(targetLanguage)}
                className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {promptLoading ? "Loading…" : "Skip"}
              </button>
            </div>

            {prompt ? (
              <>
                <p className="mt-4 text-3xl font-semibold leading-snug">{prompt.source_text}</p>
                <p className="mt-3 text-sm text-ink/55">
                  {prompt.domain.replace(/_/g, " ")} · {prompt.difficulty}
                  {typeof prompt.remaining_count === "number"
                    ? ` · ${prompt.remaining_count} people still needed`
                    : ""}
                </p>
              </>
            ) : (
              <p className="mt-4 text-ink/50">
                {promptLoading ? "Finding a word…" : "No word loaded."}
              </p>
            )}
          </section>

          {prompt && (
            <>
              <label className="block">
                <span className="text-sm font-medium">Write it in your language</span>
                <textarea
                  required
                  rows={3}
                  autoFocus
                  className={fieldClass}
                  value={translation}
                  onChange={(event) => setTranslation(event.target.value)}
                />
              </label>

              <section className="rounded-3xl border border-ink/10 bg-white/50 p-5">
                <p className="text-sm font-medium">Say it out loud (optional)</p>
                <p className="mt-1 text-sm text-ink/55">
                  A recording of your voice makes the data far more valuable.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white"
                    >
                      {audio ? "Record again" : "Record"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white"
                    >
                      Stop
                    </button>
                  )}
                  {recording && (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                      Recording…
                    </span>
                  )}
                  {audio && !recording && (
                    <button
                      type="button"
                      onClick={() => attachAudio(null)}
                      className="text-sm text-ink/55 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {audioUrl && <audio controls src={audioUrl} className="mt-4 w-full" />}
              </section>

              <label className="flex gap-3 text-sm">
                <input type="checkbox" required className="mt-0.5" />
                <span>
                  I agree this may be stored, reviewed, and used for research and responsible
                  AI training, with attribution and open release. Commercial use is not
                  granted.
                </span>
              </label>

              <button
                disabled={loading || promptLoading || !translation.trim()}
                className="w-full rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving…" : "Submit and get next word"}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  );
}
