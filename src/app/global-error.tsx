"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for crashes in the root layout itself, which `error.tsx`
 * can't catch — at that point the layout (and so the design system's fonts,
 * tokens and theme script) never rendered. That's why this file replaces
 * <html>/<body> and inlines its own styles rather than reaching for Tailwind
 * classes or shared components: none of them are guaranteed to be there.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#faf8f4",
          color: "#1c1a17",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "22rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#6f6657", fontSize: "0.875rem" }}>
            The app failed to start. Try again, and if it keeps happening let an
            admin know.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#d9620a",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
