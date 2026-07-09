"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

import { API_URL } from "@/lib/api";
import { firebaseAuth, googleProvider } from "@/lib/firebase";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function syncFirebaseUser(
    credential: UserCredential,
    fullName?: string,
  ) {
    const idToken = await credential.user.getIdToken();
    const response = await fetch(`${API_URL}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_token: idToken,
        full_name: fullName || credential.user.displayName || undefined,
      }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const result = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      throw new Error(
        typeof result?.detail === "string"
          ? result.detail
          : "Unable to continue",
      );
    }

    localStorage.setItem("biidp_access_token", result.access_token);
    router.push("/contribute");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const fullName =
      mode === "register" ? String(form.get("full_name")).trim() : undefined;

    try {
      const auth = firebaseAuth();
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (fullName) {
          await updateProfile(credential.user, { displayName: fullName });
        }
        await syncFirebaseUser(credential, fullName);
      } else {
        await syncFirebaseUser(
          await signInWithEmailAndPassword(auth, email, password),
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    if (!hydrated) return;
    setLoading(true);
    setError("");
    try {
      await syncFirebaseUser(await signInWithPopup(firebaseAuth(), googleProvider));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 space-y-5">
      <form method="post" onSubmit={submit} className="space-y-5">
        {mode === "register" && (
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input
              name="full_name"
              required
              minLength={2}
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium">Email address</span>
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-2 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 outline-none focus:border-reed"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={!hydrated || loading}
          className="w-full rounded-full bg-reed px-6 py-3 font-medium text-white disabled:opacity-60"
        >
          {!hydrated
            ? "Loading..."
            : loading
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        disabled={!hydrated || loading}
        onClick={continueWithGoogle}
        className="w-full rounded-full border border-ink/15 bg-white/80 px-6 py-3 font-medium text-ink transition hover:border-reed disabled:opacity-60"
      >
        Continue with Google
      </button>
    </div>
  );
}
