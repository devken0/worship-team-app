"use client";

import { useState, useTransition } from "react";
import {
  SONG_CATEGORIES,
  SONG_CATEGORY_LABELS,
  type SongCategory,
} from "@/lib/domain";
import { chordsImageUrl } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  saveLibrarySong,
  type LibrarySongPayload,
} from "@/app/manage/songs/actions";

export interface LibrarySongFormInitial {
  id?: string;
  title: string;
  default_category: SongCategory | null;
  author: string | null;
  song_key: string | null;
  bpm: number | null;
  youtube_url: string | null;
  chords_text: string | null;
  chords_image_url: string | null;
  chords_url: string | null;
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base outline-none focus:border-primary";

export default function LibrarySongForm({
  initial,
  authors = [],
}: {
  initial?: LibrarySongFormInitial;
  /** Existing authors for the autocomplete suggestions. */
  authors?: string[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<SongCategory | "">(
    initial?.default_category ?? "",
  );
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [songKey, setSongKey] = useState(initial?.song_key ?? "");
  const [bpm, setBpm] = useState(
    initial?.bpm != null ? String(initial.bpm) : "",
  );
  const [youtube, setYoutube] = useState(initial?.youtube_url ?? "");
  const [chordsText, setChordsText] = useState(initial?.chords_text ?? "");
  const [chordsImage, setChordsImage] = useState<string | null>(
    initial?.chords_image_url ?? null,
  );
  const [chordsUrl, setChordsUrl] = useState(initial?.chords_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function uploadChordPhoto(file: File) {
    // Uploads immediately on pick; saveLibrarySong cleans up photos that are
    // replaced/removed (and unreferenced) before saving. A form abandoned after
    // an upload (never saved) leaves an orphan in the bucket — negligible here.
    setError(null);
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chords")
      .upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      return;
    }
    setChordsImage(path);
  }

  function submit() {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a song title.");
      return;
    }
    const trimmedBpm = bpm.trim();
    if (trimmedBpm && !(Number(trimmedBpm) > 0)) {
      setError("BPM must be a positive number.");
      return;
    }
    const payload: LibrarySongPayload = {
      id: initial?.id,
      title,
      default_category: category || null,
      author,
      song_key: songKey,
      bpm: trimmedBpm ? Number(trimmedBpm) : null,
      youtube_url: youtube,
      chords_text: chordsText,
      chords_image_url: chordsImage,
      chords_url: chordsUrl,
    };
    startTransition(async () => {
      try {
        await saveLibrarySong(payload);
      } catch (e) {
        // redirect() throws a special error we must let through.
        if (
          e &&
          typeof e === "object" &&
          "digest" in e &&
          String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Song title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 10,000 Reasons"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          Default category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as SongCategory | "")}
          className={inputClass}
        >
          <option value="">— None —</option>
          {SONG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SONG_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="author" className="mb-1 block text-sm font-medium">
          Author / artist <span className="text-muted">(optional)</span>
        </label>
        <input
          id="author"
          list="library-song-authors"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="e.g. Matt Redman"
          className={inputClass}
        />
        {authors.length > 0 && (
          <datalist id="library-song-authors">
            {authors.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="song_key" className="mb-1 block text-sm font-medium">
            Key <span className="text-muted">(optional)</span>
          </label>
          <input
            id="song_key"
            value={songKey}
            onChange={(e) => setSongKey(e.target.value)}
            placeholder="e.g. G"
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="bpm" className="mb-1 block text-sm font-medium">
            BPM <span className="text-muted">(optional)</span>
          </label>
          <input
            id="bpm"
            type="number"
            inputMode="numeric"
            min={1}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="e.g. 73"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="youtube" className="mb-1 block text-sm font-medium">
          YouTube link <span className="text-muted">(optional)</span>
        </label>
        <input
          id="youtube"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="chords_text" className="mb-1 block text-sm font-medium">
          Chords <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="chords_text"
          value={chordsText}
          onChange={(e) => setChordsText(e.target.value)}
          placeholder="Paste the chord chart here"
          rows={3}
          className={`${inputClass} font-mono text-sm`}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Chord photo</label>
        {chordsImage ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chordsImageUrl(chordsImage) ?? ""}
              alt="Chord chart"
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => setChordsImage(null)}
              className="text-sm font-medium text-red-600"
            >
              Remove photo
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadChordPhoto(file);
              e.target.value = "";
            }}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
          />
        )}
        {uploading && <p className="mt-1 text-xs text-muted">Uploading photo…</p>}
      </div>

      <div>
        <label htmlFor="chords_url" className="mb-1 block text-sm font-medium">
          Chords link <span className="text-muted">(optional)</span>
        </label>
        <input
          id="chords_url"
          value={chordsUrl}
          onChange={(e) => setChordsUrl(e.target.value)}
          placeholder="e.g. published chords URL"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm active:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Add to song book"}
      </button>
    </div>
  );
}
