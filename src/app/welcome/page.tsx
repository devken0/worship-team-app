"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import InstrumentPicker from "@/components/InstrumentPicker";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/form";
import { Button, FormMessage } from "@/components/ui";
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
        <Input label="Your name" name="full_name" required />

        <PasswordInput
          id="password"
          name="password"
          label="Create a password"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          label="Confirm password"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <div>
          <p className="mb-2 block text-sm font-medium">
            What do you play / sing?{" "}
            <span className="text-muted">(optional)</span>
          </p>
          <InstrumentPicker />
        </div>

        {state.error && <FormMessage>{state.error}</FormMessage>}

        <Button type="submit" full disabled={pending}>
          {pending ? "Saving…" : "Finish setup"}
        </Button>
      </form>
    </main>
  );
}
