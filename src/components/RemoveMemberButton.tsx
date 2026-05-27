"use client";

import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { removeMember } from "@/app/manage/members/actions";

export default function RemoveMemberButton({
  memberId,
  name,
  disabled,
}: {
  memberId: string;
  name: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function confirm() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("member_id", memberId);
      const res = await removeMember({}, fd);
      if (res?.error) {
        toast(res.error, "error");
      } else {
        toast(`${name} was removed.`);
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || pending}
        title="Remove this member"
        className="rounded-full px-3 py-2 text-xs font-semibold text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {pending ? "Removing…" : "Remove"}
      </button>

      <ConfirmDialog
        open={open}
        title={`Remove ${name}?`}
        description="This permanently deletes their account. Their past assignments and recordings stay but lose the name."
        confirmLabel="Remove"
        tone="danger"
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
