"use client";

import { useActionState, useEffect, useRef } from "react";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui";
import { changePassword, type PasswordState } from "@/app/profile/actions";

const initial: PasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields once the change goes through.
  useEffect(() => {
    if (state.changed) formRef.current?.reset();
  }, [state.changed]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <PasswordInput
        id="current_password"
        name="current_password"
        label="Current password"
        autoComplete="current-password"
        required
      />
      <PasswordInput
        id="new_password"
        name="new_password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        id="confirm_password"
        name="confirm_password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.changed && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Password updated.
        </p>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
