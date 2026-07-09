import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="text-sm font-medium text-reed">
        ← Home
      </Link>
      <h1 className="mt-12 text-4xl font-semibold tracking-[-0.04em]">
        Join the community
      </h1>
      <p className="mt-3 text-ink/60">
        Create your contributor account. Public registration never grants
        administrative privileges.
      </p>
      <AuthForm mode="register" />
    </main>
  );
}
