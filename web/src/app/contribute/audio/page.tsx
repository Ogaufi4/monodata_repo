"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

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

export default function AudioPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("");
  const [prompt, setPrompt] = useState<GuidedPrompt | null>(null);
  const [spoken, setSpoken] = useState("");
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
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

  const attachAudio = useCallback((file: File | null) => {
    setAudio(file);
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }, []);

  const loadPrompt = useCallback(
    async (languageId: string) => {
      const token = authToken();
      if (!token) {
        setNotice({ text: "Sign in to start recording.", isError: true });
        return;
      }
      setPromptLoading(true);
      setNotice(null);
      try {
        const result = await nextPrompt(token, languageId, "pronunciation");
        if (!result.prompt) {
          setPrompt(null);
          setNotice({
            text: result.detail || "No sentences are left for this language.",
            isError: false,
          });
          return;
        }
        setPrompt(result.prompt);
        setSpoken("");
        attachAudio(null);
      } catch (caught) {
        setNotice({
          text: caught instanceof Error ? caught.message : "Could not load a sentence",
          isError: true,
        });
      } finally {
        setPromptLoading(false);
      }
    },
    [attachAudio],
  );

  function chooseLanguage(languageId: string) {
    setLanguage(languageId);
    setPrompt(null);
    setSpoken("");
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = authToken();
    if (!token || !prompt || !language || !audio) return;

    setLoading(true);
    setNotice(null);
    try {
      const languageName =
        languages.find((item) => item.id === language)?.name ?? "the language";
      const meta = derivedMetadata(prompt, languageName, categories, "recording");

      const draft = await apiPost("/contributions", token, {
        contribution_type: "audio_recording",
        language_id: language,
        source_prompt_id: prompt.id,
        ...meta,
      });

      const signed = await apiPost("/uploads/signed-url", token, {
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
      await apiPost("/uploads/confirm", token, { upload_token: signed.upload_token });

      // The spoken words, if the contributor wrote them down.
      if (spoken.trim()) {
        await apiPost("/translations", token, {
          contribution_id: draft.id,
          source_text: prompt.source_text,
          target_text: spoken.trim(),
        });
      }

      await apiPost(`/contributions/${draft.id}/consent`, token, STANDARD_CONSENT);
      await apiPost(`/contributions/${draft.id}/submit`, token);

      setNotice({ text: "Saved. Here is the next sentence.", isError: false });
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
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">Speak a sentence</h1>
      <p className="mt-4 text-ink/60">
        Pick your language, read the sentence in your own language, and record your voice.
        Everything else is filled in for you.
      </p>

      <div className="mt-10">
        <label className="block">
          <span className="text-sm font-medium">I am speaking</span>
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
              <span className="text-sm font-medium text-ink/60">Say this in your language</span>
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
                {promptLoading ? "Finding a sentence…" : "No sentence loaded."}
              </p>
            )}
          </section>

          {prompt && (
            <>
              <section className="rounded-3xl border border-ink/10 bg-white/50 p-5">
                <p className="text-sm font-medium">Record your voice</p>
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
                </div>
                {audioUrl && <audio controls src={audioUrl} className="mt-4 w-full" />}
              </section>

              <label className="block">
                <span className="text-sm font-medium">
                  Write down what you said (optional, but valuable)
                </span>
                <textarea
                  rows={2}
                  className={fieldClass}
                  value={spoken}
                  onChange={(event) => setSpoken(event.target.value)}
                />
              </label>

              <label className="flex gap-3 text-sm">
                <input type="checkbox" required className="mt-0.5" />
                <span>
                  I agree my voice may be stored, reviewed, and used for research and
                  responsible AI training, with attribution and open release. Commercial use is
                  not granted.
                </span>
              </label>

              <button
                disabled={loading || promptLoading || !audio}
                className="w-full rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving…" : "Submit and get next sentence"}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  );
}
