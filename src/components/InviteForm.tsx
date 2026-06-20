"use client";

import { useActionState } from "react";
import { Input } from "@/components/form";
import { Button, FormMessage } from "@/components/ui";
import { inviteMember, type InviteState } from "@/app/manage/members/actions";

const initial: InviteState = {};

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMember, initial);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        label="Email"
        name="email"
        type="email"
        required
        placeholder="member@email.com"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="make_admin" className="h-4 w-4" />
        Make this person an admin (can edit schedules)
      </label>

      {state.error && <FormMessage>{state.error}</FormMessage>}
      {state.invited && (
        <FormMessage tone="success">
          Invitation sent to {state.invited}.
        </FormMessage>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
