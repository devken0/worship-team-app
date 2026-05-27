"use client";

import { useActionState } from "react";
import InstrumentPicker from "@/components/InstrumentPicker";
import { updateProfile, type ProfileState } from "@/app/profile/actions";
import type { Profile } from "@/lib/domain";

const initial: ProfileState = {};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          required
          className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
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
          defaultValue={profile.phone ?? ""}
          className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium">What you play / sing</p>
        <InstrumentPicker selected={profile.instruments} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
