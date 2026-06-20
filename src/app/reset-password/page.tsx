"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { Button, FormMessage } from "@/components/ui";
import { updatePassword, type ResetPasswordState } from "./actions";

const initial: ResetPasswordState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <Logo size={72} priority className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a password you&apos;ll remember to finish signing in.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <PasswordInput
          id="password"
          name="password"
          label="New password"
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

        {state.error && <FormMessage>{state.error}</FormMessage>}

        <Button type="submit" full disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </main>
  );
}
