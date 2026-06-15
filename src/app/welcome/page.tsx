"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import InstrumentPicker from "@/components/InstrumentPicker";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui";
import { completeOnboarding, type OnboardingState } from "./actions";

const initial: OnboardingState = {};

export default function WelcomePage() {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initial,
  );

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <Logo size={56} className="mb-4" />
      <h1 className="text-2xl font-bold">Welcome!</h1>
      <p className="mt-1 text-sm text-muted">
        Set up your account so the team knows who you are.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Create a password"
          autoComplete="new-password"
          required
          minLength={6}
        />

        <div>
          <p className="mb-2 block text-sm font-medium">
            What do you play / sing?{" "}
            <span className="text-muted">(optional)</span>
          </p>
          <InstrumentPicker />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <Button type="submit" full disabled={pending}>
          {pending ? "Saving…" : "Finish setup"}
        </Button>
      </form>
    </main>
  );
}
