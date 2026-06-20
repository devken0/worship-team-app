"use client";

import Link from "next/link";
import { useActionState } from "react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initial: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initial,
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <Logo size={72} priority className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      {state.sent ? (
        <div className="rounded-xl bg-green-50 px-4 py-4 text-center text-sm text-green-800">
          If an account exists for that email, a reset link is on its way. Check
          your inbox and follow the link to choose a new password.
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Button type="submit" full disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary font-medium">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
