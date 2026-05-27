"use client";

import { useState, useTransition } from "react";
import { runCleanupNow, type CleanupResult } from "@/app/manage/actions";

function describe(r: CleanupResult): string {
  if ("error" in r) return r.error;
  const parts = [
    `${r.expiredRecordings} expired recording${r.expiredRecordings === 1 ? "" : "s"}`,
    `${r.recordingOrphans + r.chordOrphans} orphan file${r.recordingOrphans + r.chordOrphans === 1 ? "" : "s"}`,
  ];
  const base = `Removed ${parts.join(" and ")}.`;
  return r.errors.length > 0 ? `${base} (${r.errors.length} task error(s))` : base;
}

export default function CleanupButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            setResult(describe(await runCleanupNow()));
          })
        }
        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Cleaning up…" : "Run cleanup now"}
      </button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
