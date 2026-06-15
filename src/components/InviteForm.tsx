"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { inviteMember, type InviteState } from "@/app/manage/members/actions";

const initial: InviteState = {};

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMember, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="inv_email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="inv_email"
          name="email"
          type="email"
          required
          placeholder="member@email.com"
          className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="make_admin" className="h-4 w-4" />
        Make this person an admin (can edit schedules)
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.invited && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Invitation sent to {state.invited}.
        </p>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
