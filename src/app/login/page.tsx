"use client";

import Link from "next/link";
import { useActionState } from "react";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/form";
import { Button, FormMessage } from "@/components/ui";
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
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          required
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary"
          >
            Forgot password?
          </Link>
        </div>

        {state.error && <FormMessage>{state.error}</FormMessage>}

        <Button type="submit" full disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        New members are invited by an admin. Check your email for an
        invitation link.
      </p>
    </main>
  );
}
