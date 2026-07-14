"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { type Language } from "@/lib/api";
import {
  apiPost,
  authToken,
  DOMAIN_CATEGORY,
  fieldClass,
  loadList,
  STANDARD_CONSENT,
  type Category,
} from "@/lib/guided";

type MediaUploadFormProps = {
  heading: string;
  contributionType: "audio_recording" | "image" | "video" | "document";
  accept: string;
  mediaLabel: string;
  enableRecording?: boolean;
  capture?: "user" | "environment";
};

// Category name -> corpus domain, so the contributor picks a topic and the
// domain is filled in for them.
const CATEGORY_DOMAIN: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_CATEGORY).map(([domain, category]) => [category, domain]),
);

/** "IMG_2024 photo.jpeg" -> "IMG 2024 photo" */
function titleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Untitled").slice(0, 200);
}

export function MediaUploadForm({
  heading,
  contributionType,
  accept,
  mediaLabel,
  enableRecording = false,
  capture,
}: MediaUploadFormProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
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
        chooseFile(
          new File([new Blob(chunksRef.current, { type })], `recording-${Date.now()}.${extension}`, {
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
    if (!token) {
      setNotice({ text: `Sign in before sharing ${mediaLabel.toLowerCase()}.`, isError: true });
      return;
    }
    const file = selectedFile;
    if (!file?.size) {
      setNotice({ text: `Choose a ${mediaLabel.toLowerCase()} file.`, isError: true });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const category = categories.find((item) => item.id === categoryId);
      const languageName = languages.find((item) => item.id === language)?.name ?? "the language";
      if (!category) throw new Error("Choose a topic.");

      // Derived from the file and the chosen topic — nothing to invent.
      const draft = await apiPost("/contributions", token, {
        contribution_type: contributionType,
        title: titleFromFile(file.name),
        description: `${mediaLabel} contribution in ${languageName} about ${category.name.toLowerCase()}.`,
        language_id: language,
        category_id: category.id,
        domain: CATEGORY_DOMAIN[category.name] ?? "daily_life",
        tags: [],
        source: "Contributor upload",
        license_type: "CC BY 4.0",
      });

      const signed = await apiPost("/uploads/signed-url", token, {
        contribution_id: draft.id,
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });
      const upload = await fetch(signed.upload_url, {
        method: "PUT",
        headers: signed.required_headers,
        body: file,
      });
      if (!upload.ok) {
        throw new Error(`Storage rejected the upload (${upload.status}).`);
      }
      await apiPost("/uploads/confirm", token, { upload_token: signed.upload_token });
      await apiPost(`/contributions/${draft.id}/consent`, token, STANDARD_CONSENT);
      await apiPost(`/contributions/${draft.id}/submit`, token);

      chooseFile(null);
      setNotice({ text: `${mediaLabel} submitted for review. Thank you.`, isError: false });
    } catch (caught) {
      setNotice({
        text: caught instanceof Error ? caught.message : "Upload failed",
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
      <h1 className="mt-12 text-5xl font-semibold tracking-[-0.04em]">{heading}</h1>
      <p className="mt-4 text-ink/60">
        Choose your language and the topic, then add the file. The title and description are
        filled in for you.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Language</span>
            <select
              required
              className={fieldClass}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="">Select your language</option>
              {languages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.local_name || item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Topic</span>
            <select
              required
              className={fieldClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Select a topic</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">{mediaLabel} file</span>
          <input
            type="file"
            accept={accept}
            capture={capture}
            required={!selectedFile}
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            className={fieldClass}
          />
        </label>

        {enableRecording && (
          <section className="rounded-3xl border border-ink/10 bg-white/50 p-5">
            <p className="text-sm font-medium">Or record in your browser</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white"
                >
                  {selectedFile ? "Record again" : "Record"}
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
          </section>
        )}

        {previewUrl && contributionType === "audio_recording" && (
          <audio controls src={previewUrl} className="w-full" />
        )}
        {previewUrl && contributionType === "image" && (
          // The source is a local object URL chosen by the contributor.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected contribution preview"
            className="max-h-96 w-full rounded-3xl bg-white object-contain"
          />
        )}

        <label className="flex gap-3 text-sm">
          <input type="checkbox" required className="mt-0.5" />
          <span>
            I agree this may be stored, reviewed, and used for research and responsible AI
            training, with attribution and open release. Commercial use is not granted.
          </span>
        </label>

        {notice && (
          <p className={`text-sm ${notice.isError ? "text-red-700" : "text-reed"}`}>
            {notice.text}
          </p>
        )}

        <button
          disabled={loading || !languages.length || !categories.length}
          className="w-full rounded-full bg-reed px-7 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Uploading…" : `Submit ${mediaLabel.toLowerCase()}`}
        </button>
      </form>
    </main>
  );
}
