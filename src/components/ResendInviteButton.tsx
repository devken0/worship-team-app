"use client";

import { useTransition } from "react";
import { useToast } from "@/components/ToastProvider";
import { resendInvite } from "@/app/manage/members/actions";

export default function ResendInviteButton({
  memberId,
  name,
}: {
  memberId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function onClick() {
    startTransition(async () => {
      const res = await resendInvite(memberId);
      if (res?.error) {
        toast(res.error, "error");
      } else {
        toast(`Invitation re-sent to ${name}.`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Resend"}
    </button>
  );
}
