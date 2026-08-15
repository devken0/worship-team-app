"use client";

import { type SongCategory } from "@/lib/domain";
import Modal from "@/components/Modal";
import { CategoryBadge } from "@/components/ui";

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
  return (
    <Modal
      open
      onClose={onClose}
      variant="sheet"
      label={`${song.title} — chords`}
    >
      <>
        {song.category && <CategoryBadge category={song.category} />}
        <h2 className="mt-2 text-2xl font-bold leading-tight">{song.title}</h2>
        {song.author && (
          <p className="mt-1 text-sm text-muted">by {song.author}</p>
        )}
        {song.leaderName && (
          <p className="mt-0.5 text-sm text-muted">Led by {song.leaderName}</p>
        )}

        {(song.songKey || song.bpm != null) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {song.songKey && (
              <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-muted">
                Key {song.songKey}
              </span>
            )}
            {song.bpm != null && (
              <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-muted">
                {song.bpm} BPM
              </span>
            )}
          </div>
        )}

        {song.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2 text-sm">
            {song.notes}
          </p>
        )}

        {song.lyrics && (
          <div className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 text-sm leading-relaxed">
            {song.lyrics}
          </div>
        )}

        {song.chordsText && (
          <pre className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 font-mono text-sm leading-relaxed">
            {song.chordsText}
          </pre>
        )}
      </>
    </Modal>
  );
}
