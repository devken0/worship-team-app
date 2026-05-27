"use client";

import { useState } from "react";
import { youTubeId } from "@/lib/format";
import { SONG_CATEGORY_LABELS, type SongCategory } from "@/lib/domain";

export interface SongCardData {
  title: string;
  category: SongCategory;
  youtube_url: string | null;
  chords_text: string | null;
  leaderName: string | null;
}

const categoryColor: Record<SongCategory, string> = {
  welcoming: "bg-amber-100 text-amber-800",
  praise: "bg-sky-100 text-sky-800",
  worship: "bg-violet-100 text-violet-800",
};

export default function SongCard({ song }: { song: SongCardData }) {
  const [playing, setPlaying] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const ytId = youTubeId(song.youtube_url);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryColor[song.category]}`}
        >
          {SONG_CATEGORY_LABELS[song.category]}
        </span>
        <h3 className="mt-1.5 text-base font-semibold leading-tight">
          {song.title}
        </h3>
        {song.leaderName && (
          <p className="mt-0.5 text-sm text-muted">Led by {song.leaderName}</p>
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
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-active:scale-95">
                  ▶
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

      {song.chords_text && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setShowChords((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          >
            <span>Chords</span>
            <span className="text-muted">{showChords ? "Hide" : "Show"}</span>
          </button>
          {showChords && (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words bg-background px-4 py-3 font-mono text-sm leading-relaxed">
              {song.chords_text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
