"use client";

import { useActionState } from "react";
import { removeMember, type RemoveResult } from "@/app/manage/members/actions";

const initial: RemoveResult = {};

export default function RemoveMemberButton({
  memberId,
  name,
  disabled,
}: {
  memberId: string;
  name: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(removeMember, initial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Remove ${name}? This permanently deletes their account. Their past assignments and recordings stay but lose the name.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <button
        type="submit"
        disabled={disabled || pending}
        title={state.error ?? "Remove this member"}
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-40"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
