"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons";

/**
 * Delete trigger that confirms before submitting. Wraps an existing
 * FormData-based server action (which may redirect) without changing it:
 * the hidden `fields` are submitted via the form on confirm.
 */
export default function DeleteButton({
  action,
  fields,
  label,
  confirmTitle,
  confirmMessage,
  confirmLabel = "Delete",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel?: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <form ref={formRef} action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-card px-4 py-3 text-sm font-semibold text-danger active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        }
      >
        <TrashIcon size={16} />
        {label}
      </button>

      <ConfirmDialog
        open={open}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmLabel}
        tone="danger"
        pending={pending}
        onConfirm={() => {
          setPending(true);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </form>
  );
}
