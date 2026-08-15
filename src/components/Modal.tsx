"use client";

import { useEffect, useId, useRef } from "react";
import { XIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { useFocusTrap } from "@/lib/useFocusTrap";

/**
 * The app's one overlay primitive.
 *
 * Every dialog used to reimplement backdrop, Escape, background-scroll lock and
 * focus trapping for itself, and they disagreed: one had no scroll lock, one had
 * no focus trap, and two put `role="dialog"` on the scrolling backdrop instead
 * of the panel. This owns all of it once.
 *
 * Two shapes:
 * - `center` — a compact card, bottom-sheet on small screens. Confirmations.
 * - `sheet`  — a tall scrolling panel with a floating close button on the
 *   backdrop, so the card itself stays clean enough to screenshot.
 */
export default function Modal({
  open,
  onClose,
  title,
  label,
  variant = "center",
  dismissible = true,
  showClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Visible heading, rendered inside the panel and used as its accessible name. */
  title?: string;
  /** Accessible name when there is no visible heading. */
  label?: string;
  variant?: "center" | "sheet";
  /** Set false while a mutation is in flight to block Escape and backdrop clicks. */
  dismissible?: boolean;
  /** Defaults to true for `sheet`, false for `center`. */
  showClose?: boolean;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock background scroll so the page behind doesn't move under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  const isSheet = variant === "sheet";
  const closeVisible = showClose ?? isSheet;

  return (
    <div
      onClick={() => dismissible && onClose()}
      className={
        isSheet
          ? "fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4"
          : "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      }
    >
      {closeVisible && (
        <IconButton
          label="Close"
          variant="scrim"
          onClick={onClose}
          className="fixed right-4 top-4 z-10"
        >
          <XIcon size={18} />
        </IconButton>
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={
          isSheet
            ? "mx-auto my-10 w-full max-w-md rounded-2xl bg-card p-6 shadow-xl outline-none"
            : "w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg outline-none"
        }
      >
        {title && (
          <h2
            id={titleId}
            className={isSheet ? "text-lg font-bold" : "text-base font-semibold"}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
