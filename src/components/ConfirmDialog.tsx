"use client";

import Modal from "@/components/Modal";

/**
 * Accessible confirmation modal. Renders nothing when `open` is false.
 * Escape and backdrop click cancel (both suppressed while `pending`); focus is
 * trapped inside the panel and restored to the trigger on close — all of that
 * comes from {@link Modal}.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmClasses =
    tone === "danger"
      ? "bg-danger text-danger-foreground"
      : "bg-primary text-primary-foreground";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      dismissible={!pending}
      variant="center"
    >
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 ${confirmClasses}`}
        >
          {pending ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
