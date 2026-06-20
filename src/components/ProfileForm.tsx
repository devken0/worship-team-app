"use client";

import { useActionState } from "react";
import InstrumentPicker from "@/components/InstrumentPicker";
import { Input } from "@/components/form";
import { Button, FormMessage } from "@/components/ui";
import { updateProfile, type ProfileState } from "@/app/profile/actions";
import type { Profile } from "@/lib/domain";

const initial: ProfileState = {};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);

  return (
    <form action={formAction} className="space-y-5">
      <Input
        label="Name"
        name="full_name"
        defaultValue={profile.full_name}
        required
      />

      <div>
        <p className="mb-2 block text-sm font-medium">What you play / sing</p>
        <InstrumentPicker selected={profile.instruments} />
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="email_notifications"
          defaultChecked={!profile.email_opt_out}
          className="mt-0.5 h-5 w-5 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-sm">
          <span className="font-medium">Email me reminders</span>
          <span className="block text-muted">
            Schedule assignments, evaluation follow-ups, new recordings, and the
            weekly Sunday reminder.
          </span>
        </span>
      </label>

      {state.error && <FormMessage>{state.error}</FormMessage>}
      {state.saved && <FormMessage tone="success">Saved!</FormMessage>}

      <Button type="submit" full disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
