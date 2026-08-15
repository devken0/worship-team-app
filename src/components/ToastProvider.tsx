"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type Tone = "success" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(
  () => {},
);

/** Show a transient toast. Call `toast("Saved", "success")`. */
export function useToast() {
  return useContext(ToastContext);
}

/** Successes are transient; a failure needs long enough to read and act on. */
const DISMISS_MS: Record<Tone, number> = { success: 3000, error: 6000 };

/** Keeps a burst of toasts from covering the screen. */
const MAX_VISIBLE = 3;

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, tone }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), DISMISS_MS[tone]);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/*
        Two live regions rather than one. A single `polite` region meant a failed
        save could sit in the queue behind other announcements, or go unread
        entirely — errors need `assertive` so they interrupt. The politeness of a
        live region is fixed when it's created, so the tone has to pick the
        region rather than an attribute.
      */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {(["error", "success"] as const).map((region) => (
          <div
            key={region}
            role={region === "error" ? "alert" : "status"}
            aria-live={region === "error" ? "assertive" : "polite"}
            className="flex w-full flex-col items-center gap-2"
          >
            {toasts
              .filter((t) => t.tone === region)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label={`Dismiss: ${t.message}`}
                  className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-left text-sm font-medium shadow-lg transition active:scale-[0.98] ${
                    t.tone === "success"
                      ? "bg-success text-success-foreground"
                      : "bg-danger text-danger-foreground"
                  }`}
                >
                  {t.message}
                </button>
              ))}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
