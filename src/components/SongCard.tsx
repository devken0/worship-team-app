"use client";

import { useState } from "react";
import { youTubeId } from "@/lib/format";
import { SONG_CATEGORY_LABELS, type SongCategory } from "@/lib/domain";
import { PlayIcon } from "@/components/icons";
import SongShareSheet from "@/components/SongShareSheet";

export interface SongCardData {
  title: string;
  /** Category chip; omit (null) for song-book entries without a default. */
  category: SongCategory | null;
  youtube_url: string | null;
  /** Original chord chart text. */
  originalChordsText: string | null;
  /** Resolved public URL of the original chord-chart photo, or null. */
  originalChordsImageUrl: string | null;
  /** External link to the original published chords, or null. */
  originalChordsUrl: string | null;
  /** Transposed chord chart text, or null to use the original. */
  transposedChordsText?: string | null;
  /** Resolved public URL of the transposed chord-chart photo, or null. */
  transposedChordsImageUrl?: string | null;
  /** External link to transposed published chords, or null. */
  transposedChordsUrl?: string | null;
  leaderName: string | null;
  /** Songwriter or original artist; omitted for per-service songs. */
  author?: string | null;
  /** Original musical key, e.g. "G". */
  originalKey?: string | null;
  /** Original tempo in BPM. */
  originalBpm?: number | null;
  /** Performed key when transposed off the original, or null/empty. */
  transposedKey?: string | null;
  /** Performed tempo when changed off the original, or null. */
  transposedBpm?: number | null;
  /** Free-text notes for the team; shown as a block when present. */
  notes?: string | null;
}

const categoryColor: Record<SongCategory, string> = {
  warm_up: "bg-orange-100 text-orange-800",
  welcoming: "bg-amber-100 text-amber-800",
  praise: "bg-sky-100 text-sky-800",
  worship: "bg-violet-100 text-violet-800",
  closing: "bg-emerald-100 text-emerald-800",
};

// Lightweight inline icons (no icon dependency); inherit color via currentColor.
const iconClass = "h-4 w-4 shrink-0";

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={iconClass}
      aria-hidden="true"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// Corner-bracket "screen capture" frame — reads as screenshot/snapshot.
function ScreenshotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}

export default function SongCard({ song }: { song: SongCardData }) {
  const [playing, setPlaying] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const ytId = youTubeId(song.youtube_url);

  // Performed value = transposed override when set, else the original. Show the
  // "(orig. …)" note + "Transposed" badge only when both exist and differ.
  const origKey = song.originalKey?.trim() || null;
  const transKey = song.transposedKey?.trim() || null;
  const performedKey = transKey ?? origKey;
  const keyTransposed = !!(transKey && origKey && transKey !== origKey);

  const origBpm = song.originalBpm ?? null;
  const transBpm = song.transposedBpm ?? null;
  const performedBpm = transBpm ?? origBpm;
  const bpmTransposed =
    transBpm != null && origBpm != null && transBpm !== origBpm;

  // Performed chords = the transposed chart when present, else the original
  // (per field, since a chart in the new key replaces the original). But once
  // the *key* is transposed, the original chart is in the wrong key, so we
  // don't fall back to it — a blank transposed field shows nothing rather than
  // misleading original-key chords. (A BPM-only change keeps the chords valid,
  // so the fallback still applies there.)
  const origChordsText = keyTransposed ? null : song.originalChordsText;
  const origChordsImageUrl = keyTransposed ? null : song.originalChordsImageUrl;
  const origChordsUrl = keyTransposed ? null : song.originalChordsUrl;

  const chordsText = song.transposedChordsText?.trim() || origChordsText;
  const chordsImageUrl = song.transposedChordsImageUrl ?? origChordsImageUrl;
  const chordsUrl = song.transposedChordsUrl?.trim() || origChordsUrl;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setShowShare(true)}
        aria-label={`Screenshot view of ${song.title}`}
        title="Screenshot view"
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted transition active:scale-90 hover:bg-background hover:text-foreground"
      >
        <ScreenshotIcon />
      </button>

      <div className="p-4 pr-12">
        {song.category && (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryColor[song.category]}`}
          >
            {SONG_CATEGORY_LABELS[song.category]}
          </span>
        )}
        <h3 className="mt-1.5 text-base font-semibold leading-tight">
          {song.title}
        </h3>
        {song.author && (
          <p className="mt-0.5 text-sm text-muted">by {song.author}</p>
        )}
        {song.leaderName && (
          <p className="mt-0.5 text-sm text-muted">Led by {song.leaderName}</p>
        )}
        {(performedKey || performedBpm != null) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {performedKey && (
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted">
                Key {performedKey}
                {keyTransposed && (
                  <span className="font-normal text-muted/70">
                    {" "}
                    (orig. {origKey})
                  </span>
                )}
              </span>
            )}
            {performedBpm != null && (
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted">
                {performedBpm} BPM
                {bpmTransposed && (
                  <span className="font-normal text-muted/70">
                    {" "}
                    (orig. {origBpm})
                  </span>
                )}
              </span>
            )}
            {(keyTransposed || bpmTransposed) && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                Transposed
              </span>
            )}
          </div>
        )}
        {song.notes && (
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-sm text-foreground">
            {song.notes}
          </p>
        )}
      </div>

      {ytId && (
        <div className="relative aspect-video bg-black">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title={song.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label={`Play ${song.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover opacity-90"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-105 group-active:scale-95">
                  <PlayIcon size={26} className="translate-x-0.5" />
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {song.youtube_url && !ytId && (
        <a
          href={song.youtube_url}
          target="_blank"
          rel="noreferrer"
          className="block border-t border-border px-4 py-3 text-sm font-medium text-primary"
        >
          Open video link ↗
        </a>
      )}

      {(chordsText || chordsImageUrl || chordsUrl) && (
        <div className="border-t border-border">
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Chords
          </p>
          <div className="divide-y divide-border">
            {chordsText && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowChords((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium"
                >
                  <ChartIcon />
                  <span>Chord chart</span>
                  <span className="ml-auto text-muted">
                    {showChords ? "Hide" : "Show"}
                  </span>
                </button>
                {showChords && (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words bg-background px-4 py-3 font-mono text-sm leading-relaxed">
                    {chordsText}
                  </pre>
                )}
              </div>
            )}

            {chordsImageUrl && (
              <a
                href={chordsImageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary"
              >
                <CameraIcon />
                <span>Chord photo</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chordsImageUrl}
                  alt={`Chord chart for ${song.title}`}
                  className="ml-auto h-12 w-12 rounded-lg border border-border object-cover"
                />
                <span className="text-muted">↗</span>
              </a>
            )}

            {chordsUrl && (
              <a
                href={chordsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary"
              >
                <LinkIcon />
                <span>Chord link</span>
                <span className="ml-auto text-muted">↗</span>
              </a>
            )}
          </div>
        </div>
      )}

      {showShare && (
        <SongShareSheet
          song={{
            title: song.title,
            category: song.category,
            author: song.author ?? null,
            leaderName: song.leaderName,
            songKey: performedKey,
            bpm: performedBpm,
            notes: song.notes ?? null,
            chordsText: chordsText,
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
