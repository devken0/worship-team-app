"use client";

import { useState } from "react";

/**
 * Password field with a show/hide toggle. Matches the app's input styling and
 * the inline-validation behavior of the shared form primitives: native validity
 * errors (required, minLength) render inline instead of as a browser bubble, and
 * clear once the user edits the field. Pass `error` for a server message.
 */
export default function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  required,
  minLength,
  hint,
  error: serverError,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const [native, setNative] = useState<string | null>(null);
  const shown = native ?? serverError ?? null;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          aria-invalid={shown ? true : undefined}
          aria-describedby={shown ? errorId : undefined}
          onInvalid={(e) => {
            e.preventDefault();
            setNative(e.currentTarget.validationMessage);
          }}
          onInput={() => setNative(null)}
          className={`w-full rounded-xl border bg-card px-3 py-3 pr-12 text-base outline-none transition focus:border-primary focus-visible:ring-1 focus-visible:ring-primary ${
            shown ? "border-danger" : "border-border"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {shown ? (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {shown}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
