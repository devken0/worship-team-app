"use client";

import { useState, useTransition } from "react";
import {
  SONG_CATEGORIES,
  SONG_CATEGORY_LABELS,
  type SongCategory,
} from "@/lib/domain";
import { chordsImageUrl, formatServiceDate } from "@/lib/format";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, buttonStyles, FormMessage } from "@/components/ui";
import { Input, Textarea, Select } from "@/components/form";
import {
  saveLibrarySong,
  type LibrarySongPayload,
} from "@/app/manage/songs/actions";

/** A service that links to this song, for the "apply edit to services" list. */
export interface LinkedServiceOption {
  service_id: string;
  service_date: string;
}

/** Propagatable fields and their labels, for the "changes to apply" summary. */
const PROPAGATED_FIELD_LABELS: Record<string, string> = {
  title: "title",
  author: "author",
  song_key: "original key",
  bpm: "original BPM",
  transposed_key: "transposed key",
  transposed_bpm: "transposed BPM",
  notes: "notes",
  youtube_url: "YouTube link",
  chords_text: "original chords",
  chords_image_url: "original chord photo",
  chords_url: "original chords link",
  transposed_chords_text: "transposed chords",
  transposed_chords_image_url: "transposed chord photo",
  transposed_chords_url: "transposed chords link",
};

export interface LibrarySongFormInitial {
  id?: string;
  title: string;
  default_category: SongCategory | null;
  author: string | null;
  song_key: string | null;
  bpm: number | null;
  transposed_key: string | null;
  transposed_bpm: number | null;
  notes: string | null;
  youtube_url: string | null;
  chords_text: string | null;
  chords_image_url: string | null;
  chords_url: string | null;
  transposed_chords_text: string | null;
  transposed_chords_image_url: string | null;
  transposed_chords_url: string | null;
}

export default function LibrarySongForm({
  initial,
  authors = [],
  linkedServices = [],
  today,
  cancelHref,
}: {
  initial?: LibrarySongFormInitial;
  /** Existing authors for the autocomplete suggestions. */
  authors?: string[];
  /** Services whose songs link to this entry — offered for edit propagation. */
  linkedServices?: LinkedServiceOption[];
  /** Today in Manila (YYYY-MM-DD), to split upcoming vs past services. */
  today?: string;
  /** Where the Cancel link returns to. Omit to hide it. */
  cancelHref?: string;
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
  // Transposition is an optional override on top of the original key/bpm. The
  // toggle is derived (on when either transposed value is already set); turning
  // it off clears the transposed values on save ("stick with the original").
  const [transposed, setTransposed] = useState(
    initial?.transposed_key != null ||
      initial?.transposed_bpm != null ||
      initial?.transposed_chords_text != null ||
      initial?.transposed_chords_image_url != null ||
      initial?.transposed_chords_url != null,
  );
  const [transposedKey, setTransposedKey] = useState(
    initial?.transposed_key ?? "",
  );
  const [transposedBpm, setTransposedBpm] = useState(
    initial?.transposed_bpm != null ? String(initial.transposed_bpm) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [youtube, setYoutube] = useState(initial?.youtube_url ?? "");
  const [chordsText, setChordsText] = useState(initial?.chords_text ?? "");
  const [chordsImage, setChordsImage] = useState<string | null>(
    initial?.chords_image_url ?? null,
  );
  const [chordsUrl, setChordsUrl] = useState(initial?.chords_url ?? "");
  const [transposedChordsText, setTransposedChordsText] = useState(
    initial?.transposed_chords_text ?? "",
  );
  const [transposedChordsImage, setTransposedChordsImage] = useState<
    string | null
  >(initial?.transposed_chords_image_url ?? null);
  const [transposedChordsUrl, setTransposedChordsUrl] = useState(
    initial?.transposed_chords_url ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadingTransposed, setUploadingTransposed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isUpcoming = (s: LinkedServiceOption) =>
    !today || s.service_date >= today;
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    () => new Set(linkedServices.filter(isUpcoming).map((s) => s.service_id)),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Fields changed vs the saved entry — drives the "changes to apply" summary
  // (display only; the server recomputes the diff authoritatively on save).
  const changedFieldLabels: string[] = (() => {
    if (!initial) return [];
    const trimmedBpm = bpm.trim();
    const trimmedTransposedBpm = transposedBpm.trim();
    const current: Record<string, string | number | null> = {
      title: title.trim() || null,
      author: author.trim() || null,
      song_key: songKey.trim() || null,
      bpm: trimmedBpm ? Number(trimmedBpm) : null,
      transposed_key: transposed ? transposedKey.trim() || null : null,
      transposed_bpm:
        transposed && trimmedTransposedBpm ? Number(trimmedTransposedBpm) : null,
      notes: notes.trim() || null,
      youtube_url: youtube.trim() || null,
      chords_text: chordsText.trim() || null,
      chords_image_url: chordsImage || null,
      chords_url: chordsUrl.trim() || null,
      transposed_chords_text: transposed
        ? transposedChordsText.trim() || null
        : null,
      transposed_chords_image_url: transposed ? transposedChordsImage : null,
      transposed_chords_url: transposed
        ? transposedChordsUrl.trim() || null
        : null,
    };
    const saved: Record<string, string | number | null> = {
      title: initial.title?.trim() || null,
      author: initial.author?.trim() || null,
      song_key: initial.song_key?.trim() || null,
      bpm: initial.bpm ?? null,
      transposed_key: initial.transposed_key?.trim() || null,
      transposed_bpm: initial.transposed_bpm ?? null,
      notes: initial.notes?.trim() || null,
      youtube_url: initial.youtube_url?.trim() || null,
      chords_text: initial.chords_text?.trim() || null,
      chords_image_url: initial.chords_image_url || null,
      chords_url: initial.chords_url?.trim() || null,
      transposed_chords_text: initial.transposed_chords_text?.trim() || null,
      transposed_chords_image_url: initial.transposed_chords_image_url || null,
      transposed_chords_url: initial.transposed_chords_url?.trim() || null,
    };
    return Object.keys(current)
      .filter((k) => current[k] !== saved[k])
      .map((k) => PROPAGATED_FIELD_LABELS[k]);
  })();

  const selectedPastCount = linkedServices.filter(
    (s) => selectedServiceIds.has(s.service_id) && !isUpcoming(s),
  ).length;

  async function uploadChordPhoto(
    file: File,
    setPath: (p: string) => void,
    setBusy: (b: boolean) => void,
  ) {
    // Uploads immediately on pick; saveLibrarySong cleans up photos that are
    // replaced/removed (and unreferenced) before saving. A form abandoned after
    // an upload (never saved) leaves an orphan in the bucket — negligible here.
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chords")
      .upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      return;
    }
    setPath(path);
  }

  function buildPayload(): LibrarySongPayload | null {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a song title.");
      return null;
    }
    const trimmedBpm = bpm.trim();
    if (trimmedBpm && !(Number(trimmedBpm) > 0)) {
      setError("BPM must be a positive number.");
      return null;
    }
    const trimmedTransposedBpm = transposed ? transposedBpm.trim() : "";
    if (trimmedTransposedBpm && !(Number(trimmedTransposedBpm) > 0)) {
      setError("Transposed BPM must be a positive number.");
      return null;
    }
    return {
      id: initial?.id,
      title,
      default_category: category || null,
      author,
      song_key: songKey,
      bpm: trimmedBpm ? Number(trimmedBpm) : null,
      transposed_key: transposed ? transposedKey : "",
      transposed_bpm: trimmedTransposedBpm ? Number(trimmedTransposedBpm) : null,
      notes,
      youtube_url: youtube,
      chords_text: chordsText,
      chords_image_url: chordsImage,
      chords_url: chordsUrl,
      transposed_chords_text: transposed ? transposedChordsText : "",
      transposed_chords_image_url: transposed ? transposedChordsImage : null,
      transposed_chords_url: transposed ? transposedChordsUrl : "",
      applyToServiceIds: [...selectedServiceIds],
    };
  }

  function runSave(payload: LibrarySongPayload) {
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

  function submit() {
    const payload = buildPayload();
    if (!payload) return;
    // Rewriting a past service changes the record of what was played — confirm.
    if (selectedPastCount > 0) {
      setConfirmOpen(true);
      return;
    }
    runSave(payload);
  }

  return (
    <div className="space-y-3">
      <Input
        label="Song title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. 10,000 Reasons"
      />

      <Select
        label="Default category"
        value={category}
        onChange={(e) => setCategory(e.target.value as SongCategory | "")}
      >
        <option value="">— None —</option>
        {SONG_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {SONG_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>

      <div>
        <Input
          id="author"
          label={
            <>
              Author / artist <span className="text-muted">(optional)</span>
            </>
          }
          list="library-song-authors"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="e.g. Matt Redman"
        />
        {authors.length > 0 && (
          <datalist id="library-song-authors">
            {authors.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        )}
      </div>

      <Input
        label={
          <>
            YouTube link <span className="text-muted">(optional)</span>
          </>
        }
        value={youtube}
        onChange={(e) => setYoutube(e.target.value)}
        placeholder="https://youtube.com/watch?v=…"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label={
              <>
                Original key <span className="text-muted">(optional)</span>
              </>
            }
            value={songKey}
            onChange={(e) => setSongKey(e.target.value)}
            placeholder="e.g. G"
          />
        </div>
        <div className="flex-1">
          <Input
            label={
              <>
                Original BPM <span className="text-muted">(optional)</span>
              </>
            }
            type="number"
            inputMode="numeric"
            min={1}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="e.g. 73"
          />
        </div>
      </div>

      <Textarea
        label={
          <>
            Original chords <span className="text-muted">(optional)</span>
          </>
        }
        value={chordsText}
        onChange={(e) => setChordsText(e.target.value)}
        placeholder="Paste the chord chart here"
        rows={3}
        className="font-mono text-sm"
      />

      <div>
        <label className="mb-1 block text-xs text-muted">
          Original chord photo
        </label>
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
              className="text-sm font-medium text-danger"
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
              if (file) uploadChordPhoto(file, setChordsImage, setUploading);
              e.target.value = "";
            }}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
          />
        )}
        {uploading && <p className="mt-1 text-xs text-muted">Uploading photo…</p>}
      </div>

      <Input
        label={
          <>
            Original chords link <span className="text-muted">(optional)</span>
          </>
        }
        value={chordsUrl}
        onChange={(e) => setChordsUrl(e.target.value)}
        placeholder="e.g. published chords URL"
      />

      <div className="space-y-3 rounded-xl border border-border p-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={transposed}
            onChange={(e) => setTransposed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>
            Transpose this song
            <span className="block text-xs text-muted">
              Set a default performed key/tempo and chord chart different from
              the original. Scheduled songs inherit this and can re-transpose per
              service.
            </span>
          </span>
        </label>
        {transposed && (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Transposed key"
                  value={transposedKey}
                  onChange={(e) => setTransposedKey(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Transposed BPM"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={transposedBpm}
                  onChange={(e) => setTransposedBpm(e.target.value)}
                  placeholder="e.g. 80"
                />
              </div>
            </div>

            <Textarea
              label="Transposed chords"
              value={transposedChordsText}
              onChange={(e) => setTransposedChordsText(e.target.value)}
              placeholder="Paste the transposed chord chart here"
              rows={3}
              className="font-mono text-sm"
            />

            <div>
              <label className="mb-1 block text-xs text-muted">
                Transposed chord photo
              </label>
              {transposedChordsImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={chordsImageUrl(transposedChordsImage) ?? ""}
                    alt="Transposed chord chart"
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setTransposedChordsImage(null)}
                    className="text-sm font-medium text-danger"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={uploadingTransposed}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      uploadChordPhoto(
                        file,
                        setTransposedChordsImage,
                        setUploadingTransposed,
                      );
                    e.target.value = "";
                  }}
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
                />
              )}
              {uploadingTransposed && (
                <p className="mt-1 text-xs text-muted">Uploading photo…</p>
              )}
            </div>

            <Input
              label="Transposed chords link"
              value={transposedChordsUrl}
              onChange={(e) => setTransposedChordsUrl(e.target.value)}
              placeholder="e.g. published chords URL"
            />
          </>
        )}
      </div>

      <Textarea
        label={
          <>
            Notes <span className="text-muted">(optional)</span>
          </>
        }
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Arrangement reminders, cues, capo, etc."
        rows={3}
      />

      {initial?.id && linkedServices.length > 0 && (
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Used in {linkedServices.length} service
              {linkedServices.length === 1 ? "" : "s"}
            </p>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setSelectedServiceIds(
                    new Set(
                      linkedServices.filter(isUpcoming).map((s) => s.service_id),
                    ),
                  )
                }
                className="text-primary"
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedServiceIds(
                    new Set(linkedServices.map((s) => s.service_id)),
                  )
                }
                className="text-primary"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceIds(new Set())}
                className="text-muted"
              >
                None
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">
            {changedFieldLabels.length > 0
              ? `Checked services will get your changes to: ${changedFieldLabels.join(", ")}.`
              : "Edit a field above to push it to the checked services."}
          </p>
          <ul className="mt-2 space-y-1.5">
            {linkedServices.map((s) => {
              const past = !isUpcoming(s);
              return (
                <li key={s.service_id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(s.service_id)}
                      onChange={() => toggleService(s.service_id)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span>{formatServiceDate(s.service_date)}</span>
                    <span
                      className={`text-xs ${past ? "text-muted" : "text-primary"}`}
                    >
                      {past ? "Past" : "Upcoming"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <FormMessage>{error}</FormMessage>}

      <Button type="button" full onClick={submit} disabled={pending}>
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Add to song book"}
      </Button>
      {cancelHref && (
        <Link
          href={cancelHref}
          className={buttonStyles({ variant: "ghost", full: true })}
        >
          Cancel
        </Link>
      )}

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Apply to past services?"
        description={`This applies your changes to ${selectedServiceIds.size} service${
          selectedServiceIds.size === 1 ? "" : "s"
        }, including ${selectedPastCount} past one${
          selectedPastCount === 1 ? "" : "s"
        } that record what you already played.`}
        confirmLabel="Apply changes"
        pending={pending}
        onConfirm={() => {
          const payload = buildPayload();
          setConfirmOpen(false);
          if (payload) runSave(payload);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
