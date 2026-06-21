"use client";

import { useEffect, useRef } from "react";
import { SONG_CATEGORY_LABELS, type SongCategory } from "@/lib/domain";
import { XIcon } from "@/components/icons";
import { useFocusTrap } from "@/lib/useFocusTrap";

// Kept in sync with the chip colors in SongCard.tsx.
const categoryColor: Record<SongCategory, string> = {
  warm_up: "bg-orange-100 text-orange-800",
  welcoming: "bg-amber-100 text-amber-800",
  praise: "bg-sky-100 text-sky-800",
  worship: "bg-violet-100 text-violet-800",
  closing: "bg-emerald-100 text-emerald-800",
};

export interface SongShareData {
  title: string;
  category: SongCategory | null;
  author: string | null;
  leaderName: string | null;
  songKey: string | null;
  bpm: number | null;
  notes: string | null;
  chordsText: string | null;
  lyrics: string | null;
}

/**
 * A full-screen, read-only display of a single song meant to be screenshotted
 * and shared (e.g. to a group chat). Text only — no video, photo, or links.
 * The only control (close) floats in the dim backdrop so the card stays clean.
 */
export default function SongShareSheet({
  song,
  onClose,
}: {
  song: SongShareData;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

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

  return (
    <div
      ref={dialogRef}
      onClick={onClose}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${song.title} — chords`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
      >
        <XIcon size={18} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto my-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        {song.category && (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor[song.category]}`}
          >
            {SONG_CATEGORY_LABELS[song.category]}
          </span>
        )}
        <h2 className="mt-2 text-2xl font-bold leading-tight text-gray-900">
          {song.title}
        </h2>
        {song.author && (
          <p className="mt-1 text-sm text-gray-500">by {song.author}</p>
        )}
        {song.leaderName && (
          <p className="mt-0.5 text-sm text-gray-500">Led by {song.leaderName}</p>
        )}

        {(song.songKey || song.bpm != null) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {song.songKey && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                Key {song.songKey}
              </span>
            )}
            {song.bpm != null && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                {song.bpm} BPM
              </span>
            )}
          </div>
        )}

        {song.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-sm text-gray-900">
            {song.notes}
          </p>
        )}

        {song.lyrics && (
          <div className="mt-4 whitespace-pre-wrap break-words border-t border-gray-200 pt-4 text-sm leading-relaxed text-gray-900">
            {song.lyrics}
          </div>
        )}

        {song.chordsText && (
          <pre className="mt-4 whitespace-pre-wrap break-words border-t border-gray-200 pt-4 font-mono text-sm leading-relaxed text-gray-900">
            {song.chordsText}
          </pre>
        )}
      </div>
    </div>
  );
}
