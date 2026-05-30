"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

/** Chat-bubble glyph — reads as "message / send to group chat". */
function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5z" />
    </svg>
  );
}

/**
 * Triggers a sheet for sending a service reminder to the group chat. We can't
 * post into a Messenger group chat programmatically (no API exists for that),
 * so this is assisted-manual: the app composes the message, the admin tweaks it
 * if needed, then Shares (OS share sheet → Messenger → the group) or Copies it.
 */
export default function ReminderButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition active:scale-[0.98]"
      >
        <ChatIcon />
        Send reminder to group chat
      </button>
      {open && (
        <ReminderSheet initialText={text} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ReminderSheet({
  initialText,
  onClose,
}: {
  initialText: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState(initialText);
  // The sheet only mounts on click (never server-rendered), so reading
  // navigator here can't cause a hydration mismatch.
  const [canShare] = useState(
    () => typeof navigator !== "undefined" && !!navigator.share,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Reminder copied — paste it in the group chat");
    } catch {
      toast("Couldn't copy. Select the text and copy manually.", "error");
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
    } catch (e) {
      // The user dismissing the share sheet rejects with AbortError — ignore it.
      if ((e as Error)?.name !== "AbortError") {
        toast("Couldn't open the share sheet.", "error");
      }
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Send reminder"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur"
      >
        ✕
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto my-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-lg font-bold text-gray-900">Group chat reminder</h2>
        <p className="mt-1 text-sm text-gray-500">
          Edit if you like, then Share to Messenger or copy and paste it into the
          group chat.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="mt-3 flex gap-2">
          {canShare && (
            <button
              type="button"
              onClick={share}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm active:opacity-90"
            >
              Share
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-[0.98] ${
              canShare
                ? "border border-border bg-card text-primary"
                : "flex-1 bg-primary text-primary-foreground"
            }`}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
