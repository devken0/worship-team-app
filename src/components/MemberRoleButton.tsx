"use client";

import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { setMemberRole } from "@/app/manage/members/actions";
import type { UserRole } from "@/lib/domain";

export default function MemberRoleButton({
  memberId,
  name,
  role,
  isSelf,
}: {
  memberId: string;
  name: string;
  role: UserRole;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const nextRole: UserRole = role === "admin" ? "member" : "admin";
  const isAdmin = role === "admin";

  function confirm() {
    startTransition(async () => {
      const res = await setMemberRole(memberId, nextRole);
      if (res?.error) {
        toast(res.error, "error");
      } else {
        toast(
          nextRole === "admin"
            ? `${name} is now an admin.`
            : `${name} is now a member.`,
        );
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isSelf}
        className={`rounded-full px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
          isAdmin
            ? "bg-primary/10 text-primary"
            : "border border-border text-muted"
        }`}
        title={
          isSelf
            ? "You can't change your own role"
            : isAdmin
              ? "Tap to make member"
              : "Tap to make admin"
        }
      >
        {isAdmin ? "Admin" : "Member"}
      </button>

      <ConfirmDialog
        open={open}
        title={
          nextRole === "admin"
            ? `Make ${name} an admin?`
            : `Remove admin access from ${name}?`
        }
        description={
          nextRole === "admin"
            ? "Admins can edit schedules, invite or remove members, and change roles."
            : "They'll become a regular member and lose those abilities."
        }
        confirmLabel={nextRole === "admin" ? "Make admin" : "Make member"}
        tone={nextRole === "admin" ? "default" : "danger"}
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
