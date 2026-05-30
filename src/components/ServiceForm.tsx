"use client";

import { useState, useTransition } from "react";
import {
  SINGLE_ROLES,
  ROLE_LABELS,
  SONG_CATEGORIES,
  SONG_CATEGORY_LABELS,
  WEAR_COLORS,
  type AssignmentRole,
  type SongCategory,
  type LibrarySong,
} from "@/lib/domain";
import {
  chordsImageUrl,
  isoToManilaInput,
  manilaInputToISO,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { saveService, type SongInput } from "@/app/manage/service/actions";

export interface MemberOption {
  id: string;
  full_name: string;
}

export interface ServiceFormInitial {
  id?: string;
  service_date: string;
  rehearsal_at: string | null;
  rehearsal_location: string | null;
  wear_color_label: string | null;
  wear_color_hex: string | null;
  notes: string | null;
  singleRoles: Partial<Record<AssignmentRole, string | null>>;
  backupSingers: string[];
  songs: SongInput[];
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base outline-none focus:border-primary";

function emptySong(category: SongCategory): SongInput {
  return {
    title: "",
    category,
    song_leader_id: null,
    author: "",
    song_key: "",
    bpm: null,
    youtube_url: "",
    chords_text: "",
    chords_image_url: null,
    chords_url: "",
    library_song_id: null,
  };
}

/** Build a per-service song as a snapshot copy of a song-book entry. */
function songFromLibrary(lib: LibrarySong): SongInput {
  return {
    title: lib.title,
    category: lib.default_category ?? "praise",
    song_leader_id: null,
    author: lib.author ?? "",
    song_key: lib.song_key ?? "",
    bpm: lib.bpm,
    youtube_url: lib.youtube_url ?? "",
    chords_text: lib.chords_text ?? "",
    chords_image_url: lib.chords_image_url,
    chords_url: lib.chords_url ?? "",
    library_song_id: lib.id,
  };
}

export default function ServiceForm({
  members,
  librarySongs,
  initial,
}: {
  members: MemberOption[];
  librarySongs: LibrarySong[];
  initial?: ServiceFormInitial;
}) {
  const [date, setDate] = useState(initial?.service_date ?? "");
  const [rehearsal, setRehearsal] = useState(
    isoToManilaInput(initial?.rehearsal_at ?? null),
  );
  const [location, setLocation] = useState(initial?.rehearsal_location ?? "");
  const [colorLabel, setColorLabel] = useState(
    initial?.wear_color_label ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [singleRoles, setSingleRoles] = useState<
    Partial<Record<AssignmentRole, string | null>>
  >(initial?.singleRoles ?? {});
  const [backups, setBackups] = useState<string[]>(
    initial?.backupSingers?.length ? initial.backupSingers : [""],
  );
  // Start empty for a new schedule — the admin picks from the song book or
  // adds blank songs, rather than three pre-seeded category slots.
  const [songs, setSongs] = useState<SongInput[]>(initial?.songs ?? []);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Distinct authors already in the song book, for the author autocomplete.
  const authorOptions = Array.from(
    new Set(
      librarySongs
        .map((l) => l.author?.trim())
        .filter((a): a is string => !!a),
    ),
  ).sort((a, b) => a.localeCompare(b));

  function memberSelect(
    value: string | null,
    onChange: (v: string | null) => void,
    id?: string,
  ) {
    return (
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={inputClass}
      >
        <option value="">— Unassigned —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name || "(no name)"}
          </option>
        ))}
      </select>
    );
  }

  function updateSong(i: number, patch: Partial<SongInput>) {
    setSongs((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  async function uploadChordPhoto(i: number, file: File) {
    // Uploads immediately on pick; saveService cleans up photos that are
    // replaced/removed before saving. A form abandoned after an upload (never
    // saved) leaves an orphan in the bucket — accepted as negligible here.
    setError(null);
    setUploading((prev) => ({ ...prev, [i]: true }));
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chords")
      .upload(path, file, { contentType: file.type, upsert: false });
    setUploading((prev) => ({ ...prev, [i]: false }));
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      return;
    }
    updateSong(i, { chords_image_url: path });
  }

  function submit() {
    setError(null);
    if (!date) {
      setError("Please pick the Sunday service date.");
      return;
    }
    if (songs.some((s) => s.bpm != null && !(s.bpm > 0))) {
      setError("BPM must be a positive number.");
      return;
    }
    const hex =
      WEAR_COLORS.find((c) => c.label === colorLabel)?.hex ?? "";
    startTransition(async () => {
      try {
        await saveService({
          id: initial?.id,
          service_date: date,
          rehearsal_at: manilaInputToISO(rehearsal),
          rehearsal_location: location,
          wear_color_label: colorLabel,
          wear_color_hex: hex,
          notes,
          singleRoles,
          backupSingers: backups.filter(Boolean),
          songs,
        });
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
    <div className="space-y-6">
      {/* Service basics */}
      <section className="space-y-3">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium">
            Sunday service date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="reh" className="mb-1 block text-sm font-medium">
            Rehearsal date &amp; time
          </label>
          <input
            id="reh"
            type="datetime-local"
            value={rehearsal}
            onChange={(e) => setRehearsal(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="loc" className="mb-1 block text-sm font-medium">
            Rehearsal location
          </label>
          <input
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Church sanctuary"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="color" className="mb-1 block text-sm font-medium">
            Color to wear
          </label>
          <select
            id="color"
            value={colorLabel}
            onChange={(e) => setColorLabel(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {WEAR_COLORS.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Band & service roles */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Assignments
        </h2>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          {SINGLE_ROLES.map((role) => (
            <div key={role}>
              <label className="mb-1 block text-sm font-medium">
                {ROLE_LABELS[role]}
              </label>
              {memberSelect(singleRoles[role] ?? null, (v) =>
                setSingleRoles((prev) => ({ ...prev, [role]: v })),
              )}
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Backup Singers
            </label>
            <div className="space-y-2">
              {backups.map((b, i) => (
                <div key={i} className="flex gap-2">
                  {memberSelect(b || null, (v) =>
                    setBackups((prev) =>
                      prev.map((x, idx) => (idx === i ? (v ?? "") : x)),
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setBackups((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="shrink-0 rounded-xl border border-border px-3 text-muted"
                    aria-label="Remove backup singer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBackups((prev) => [...prev, ""])}
                className="text-sm font-medium text-primary"
              >
                + Add backup singer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Songs */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Songs
        </h2>
        <div className="space-y-3">
          {authorOptions.length > 0 && (
            <datalist id="song-authors">
              {authorOptions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          )}
          {songs.map((song, i) => (
            <div
              key={i}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <select
                  value={song.category}
                  onChange={(e) =>
                    updateSong(i, {
                      category: e.target.value as SongCategory,
                    })
                  }
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm font-medium"
                >
                  {SONG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {SONG_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSongs((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-sm text-muted"
                >
                  Remove
                </button>
              </div>
              <div>
                <label
                  htmlFor={`song-${i}-title`}
                  className="mb-1 block text-xs text-muted"
                >
                  Song title
                </label>
                <input
                  id={`song-${i}-title`}
                  value={song.title}
                  onChange={(e) => updateSong(i, { title: e.target.value })}
                  placeholder="e.g. 10,000 Reasons"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Song leader
                </label>
                {memberSelect(song.song_leader_id, (v) =>
                  updateSong(i, { song_leader_id: v }),
                )}
              </div>
              <div>
                <label
                  htmlFor={`song-${i}-author`}
                  className="mb-1 block text-xs text-muted"
                >
                  Author / artist
                </label>
                <input
                  id={`song-${i}-author`}
                  list="song-authors"
                  value={song.author}
                  onChange={(e) => updateSong(i, { author: e.target.value })}
                  placeholder="e.g. Matt Redman"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label
                    htmlFor={`song-${i}-key`}
                    className="mb-1 block text-xs text-muted"
                  >
                    Key
                  </label>
                  <input
                    id={`song-${i}-key`}
                    value={song.song_key}
                    onChange={(e) =>
                      updateSong(i, { song_key: e.target.value })
                    }
                    placeholder="e.g. G"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`song-${i}-bpm`}
                    className="mb-1 block text-xs text-muted"
                  >
                    BPM
                  </label>
                  <input
                    id={`song-${i}-bpm`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={song.bpm ?? ""}
                    onChange={(e) =>
                      updateSong(i, {
                        bpm: e.target.value.trim()
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 73"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={`song-${i}-youtube`}
                  className="mb-1 block text-xs text-muted"
                >
                  YouTube link
                </label>
                <input
                  id={`song-${i}-youtube`}
                  value={song.youtube_url}
                  onChange={(e) =>
                    updateSong(i, { youtube_url: e.target.value })
                  }
                  placeholder="Paste from the pastor"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor={`song-${i}-chords`}
                  className="mb-1 block text-xs text-muted"
                >
                  Chords
                </label>
                <textarea
                  id={`song-${i}-chords`}
                  value={song.chords_text}
                  onChange={(e) =>
                    updateSong(i, { chords_text: e.target.value })
                  }
                  placeholder="Paste the chord chart here (optional)"
                  rows={3}
                  className={`${inputClass} font-mono text-sm`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Chord photo
                </label>
                {song.chords_image_url ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chordsImageUrl(song.chords_image_url) ?? ""}
                      alt="Chord chart"
                      className="h-20 w-20 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateSong(i, { chords_image_url: null })}
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
                    disabled={uploading[i]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadChordPhoto(i, file);
                      e.target.value = "";
                    }}
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
                  />
                )}
                {uploading[i] && (
                  <p className="mt-1 text-xs text-muted">Uploading photo…</p>
                )}
              </div>
              <div>
                <label
                  htmlFor={`song-${i}-chords-url`}
                  className="mb-1 block text-xs text-muted"
                >
                  Chords link
                </label>
                <input
                  id={`song-${i}-chords-url`}
                  value={song.chords_url}
                  onChange={(e) =>
                    updateSong(i, { chords_url: e.target.value })
                  }
                  placeholder="e.g. published chords URL"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          {librarySongs.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const lib = librarySongs.find((l) => l.id === e.target.value);
                if (lib) setSongs((prev) => [...prev, songFromLibrary(lib)]);
                e.target.value = "";
              }}
              className={inputClass}
            >
              <option value="">+ Add from Song Book…</option>
              {librarySongs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setSongs((prev) => [...prev, emptySong("praise")])}
            className="w-full rounded-xl border border-dashed border-border py-3 text-sm font-medium text-primary"
          >
            + Add blank song
          </button>
        </div>
      </section>

      {/* Notes */}
      <section>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes for the team
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else (call time, reminders, etc.)"
          className={inputClass}
        />
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create schedule"}
      </button>
    </div>
  );
}
