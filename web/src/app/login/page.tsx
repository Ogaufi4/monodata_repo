import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="text-sm font-medium text-reed">
        ← Home
      </Link>
      <h1 className="mt-12 text-4xl font-semibold tracking-[-0.04em]">Welcome back</h1>
      <p className="mt-3 text-ink/60">Continue your contribution journey.</p>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-ink/60">
        New here?{" "}
        <Link href="/register" className="font-medium text-reed">
          Create an account
        </Link>
      </p>
    </main>
  );
}
