"use client";

import { useActionState } from "react";
import InstrumentPicker from "@/components/InstrumentPicker";
import { completeOnboarding, type OnboardingState } from "./actions";

const initial: OnboardingState = {};

export default function WelcomePage() {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initial,
  );

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">Welcome! 🎶</h1>
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
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Create a password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone <span className="text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary"
          />
        </div>

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

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm active:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Finish setup"}
        </button>
      </form>
    </main>
  );
}
