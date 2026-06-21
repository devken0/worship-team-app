"use client";

import { useState } from "react";
import { youTubeId } from "@/lib/format";
import {
  SONG_CATEGORY_LABELS,
  SONG_CATEGORY_CHIP,
  type SongCategory,
} from "@/lib/domain";
import {
  PlayIcon,
  ChartIcon,
  CameraIcon,
  LinkIcon,
  FrameIcon,
  NoteIcon,
} from "@/components/icons";
import SongShareSheet from "@/components/SongShareSheet";
import { resolvePerformed } from "@/lib/song";

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
  /** Song lyrics; key-independent, shown in its own collapsible section. */
  lyrics?: string | null;
}

export default function SongCard({ song }: { song: SongCardData }) {
  const [playing, setPlaying] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showLyricsChords, setShowLyricsChords] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const ytId = youTubeId(song.youtube_url);
  const lyrics = song.lyrics?.trim() || null;

  // Performed key/tempo/chords (transposed override vs. original) — shared with
  // the rehearsal viewer so the two stay in sync. Show the "(orig. …)" note +
  // "Transposed" badge only when both exist and differ.
  const {
    origKey,
    performedKey,
    keyTransposed,
    origBpm,
    performedBpm,
    bpmTransposed,
    chordsText,
    chordsImageUrl,
    chordsUrl,
  } = resolvePerformed(song);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setShowShare(true)}
        aria-label={`Screenshot view of ${song.title}`}
        title="Screenshot view"
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted transition active:scale-90 hover:bg-background hover:text-foreground"
      >
        <FrameIcon size={18} />
      </button>

      <div className="p-4 pr-12">
        {song.category && (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${SONG_CATEGORY_CHIP[song.category]}`}
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
                  <span className="font-normal text-muted">
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
                  <span className="font-normal text-muted">
                    {" "}
                    (orig. {origBpm})
                  </span>
                )}
              </span>
            )}
            {(keyTransposed || bpmTransposed) && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                Transposed
              </span>
            )}
          </div>
        )}
        {song.notes && (
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2 text-sm text-foreground">
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
                  <ChartIcon size={16} className="shrink-0" />
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
                <CameraIcon size={16} className="shrink-0" />
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
                <LinkIcon size={16} className="shrink-0" />
                <span>Chord link</span>
                <span className="ml-auto text-muted">↗</span>
              </a>
            )}
          </div>
        </div>
      )}

      {lyrics && (
        <div className="border-t border-border">
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Lyrics
          </p>
          <div className="divide-y divide-border">
            <div>
              <button
                type="button"
                onClick={() => setShowLyrics((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium"
              >
                <NoteIcon size={16} className="shrink-0" />
                <span>Lyrics</span>
                <span className="ml-auto text-muted">
                  {showLyrics ? "Hide" : "Show"}
                </span>
              </button>
              {showLyrics && (
                <div className="whitespace-pre-wrap break-words bg-background px-4 py-3 text-sm leading-relaxed">
                  {lyrics}
                </div>
              )}
            </div>

            {chordsText && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowLyricsChords((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium"
                >
                  <ChartIcon size={16} className="shrink-0" />
                  <span>Lyrics + chords</span>
                  <span className="ml-auto text-muted">
                    {showLyricsChords ? "Hide" : "Show"}
                  </span>
                </button>
                {showLyricsChords && (
                  <div className="grid gap-4 bg-background px-4 py-3 sm:grid-cols-2">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                      {chordsText}
                    </pre>
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {lyrics}
                    </div>
                  </div>
                )}
              </div>
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
            lyrics: lyrics,
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
