"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

/**
 * Shared form field primitives. Each renders label + control + inline error and
 * self-manages validation: the browser's native constraint validation (required,
 * type, minLength, pattern) still gates submission and focuses the first invalid
 * field, but the default error bubble is suppressed and the message is shown
 * inline instead. Pass `error` for a server-returned message; the field clears
 * its own native error as soon as the user edits it.
 *
 * (Native validation only fires for fields inside a real <form> that submits;
 * controlled forms that submit programmatically still get the shared styling,
 * required markers, and `error` prop.)
 */

const controlBase =
  "w-full rounded-xl bg-card px-3 py-3 text-base outline-none transition focus:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-60";

/** Standalone control class for bare inputs/selects not wrapped by a primitive. */
export const controlClass = `${controlBase} border border-border`;

const DEFAULT_LABEL = "mb-1 block text-sm font-medium";

/** Tracks the native validity message, falling back to a server-provided one. */
function useInlineError(serverError?: string | null) {
  const [native, setNative] = useState<string | null>(null);
  return {
    shown: native ?? serverError ?? null,
    onInvalid: (e: React.FormEvent<HTMLElement>) => {
      e.preventDefault();
      const el = e.currentTarget as { validationMessage?: string };
      setNative(el.validationMessage ?? "This field is required.");
    },
    onInput: () => setNative(null),
  };
}

function Label({
  htmlFor,
  children,
  required,
  className = DEFAULT_LABEL,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
      {required && (
        <span className="text-danger" aria-hidden="true">
          {" *"}
        </span>
      )}
    </label>
  );
}

function Message({
  id,
  error,
  hint,
}: {
  id: string;
  error: string | null;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={id} className="mt-1 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (hint) return <p className="mt-1 text-xs text-muted">{hint}</p>;
  return null;
}

type FieldExtras = {
  label: React.ReactNode;
  hint?: string;
  error?: string | null;
  /** Override the label styling (e.g. compact `text-xs text-muted` rows). */
  labelClassName?: string;
};

export function Input({
  label,
  hint,
  error: serverError,
  labelClassName,
  id,
  required,
  className = "",
  ...props
}: FieldExtras & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const { shown, onInvalid, onInput } = useInlineError(serverError);

  return (
    <div>
      <Label htmlFor={fieldId} required={required} className={labelClassName}>
        {label}
      </Label>
      <input
        id={fieldId}
        required={required}
        aria-invalid={shown ? true : undefined}
        aria-describedby={shown ? errorId : undefined}
        {...props}
        onInvalid={onInvalid}
        onInput={onInput}
        className={`${controlBase} border ${shown ? "border-danger" : "border-border"} ${className}`}
      />
      <Message id={errorId} error={shown} hint={hint} />
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error: serverError,
  labelClassName,
  id,
  required,
  className = "",
  ...props
}: FieldExtras & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const { shown, onInvalid, onInput } = useInlineError(serverError);

  return (
    <div>
      <Label htmlFor={fieldId} required={required} className={labelClassName}>
        {label}
      </Label>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={shown ? true : undefined}
        aria-describedby={shown ? errorId : undefined}
        {...props}
        onInvalid={onInvalid}
        onInput={onInput}
        className={`${controlBase} border ${shown ? "border-danger" : "border-border"} ${className}`}
      />
      <Message id={errorId} error={shown} hint={hint} />
    </div>
  );
}

export function Select({
  label,
  hint,
  error: serverError,
  labelClassName,
  id,
  required,
  className = "",
  children,
  ...props
}: FieldExtras & SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const { shown, onInvalid, onInput } = useInlineError(serverError);

  return (
    <div>
      <Label htmlFor={fieldId} required={required} className={labelClassName}>
        {label}
      </Label>
      <select
        id={fieldId}
        required={required}
        aria-invalid={shown ? true : undefined}
        aria-describedby={shown ? errorId : undefined}
        {...props}
        onInvalid={onInvalid}
        onInput={onInput}
        className={`${controlBase} border ${shown ? "border-danger" : "border-border"} ${className}`}
      >
        {children}
      </select>
      <Message id={errorId} error={shown} hint={hint} />
    </div>
  );
}
