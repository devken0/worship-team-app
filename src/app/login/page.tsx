"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { login, type AuthState } from "./actions";

const initial: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <Logo size={72} priority className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Worship Team</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to see this week&apos;s schedule.
        </p>
      </div>

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
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          required
        />

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        New members are invited by an admin. Check your email for an
        invitation link.
      </p>
    </main>
  );
}
