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
import { XIcon } from "@/components/icons";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonStyles, FormMessage } from "@/components/ui";
import { Input, Textarea, Select, controlClass } from "@/components/form";
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

function emptySong(category: SongCategory): SongInput {
  return {
    title: "",
    category,
    song_leader_id: null,
    author: "",
    song_key: "",
    bpm: null,
    transposed_key: "",
    transposed_bpm: null,
    notes: "",
    lyrics: "",
    youtube_url: "",
    chords_text: "",
    chords_image_url: null,
    chords_url: "",
    transposed_chords_text: "",
    transposed_chords_image_url: null,
    transposed_chords_url: "",
    library_song_id: null,
    save_to_book: true,
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
    transposed_key: lib.transposed_key ?? "",
    transposed_bpm: lib.transposed_bpm,
    notes: lib.notes ?? "",
    lyrics: lib.lyrics ?? "",
    youtube_url: lib.youtube_url ?? "",
    chords_text: lib.chords_text ?? "",
    chords_image_url: lib.chords_image_url,
    chords_url: lib.chords_url ?? "",
    transposed_chords_text: lib.transposed_chords_text ?? "",
    transposed_chords_image_url: lib.transposed_chords_image_url,
    transposed_chords_url: lib.transposed_chords_url ?? "",
    library_song_id: lib.id,
    save_to_book: true,
  };
}

export default function ServiceForm({
  members,
  librarySongs,
  initial,
  cancelHref,
}: {
  members: MemberOption[];
  librarySongs: LibrarySong[];
  initial?: ServiceFormInitial;
  /** Where the Cancel link returns to. Omit to hide it. */
  cancelHref?: string;
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
  // Keyed by `${songIndex}:${photoField}` so a song can upload its original and
  // transposed chord photos independently.
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  // Song indices whose transpose inputs are revealed. Seeded from songs that
  // already carry a transposition; the values themselves drive display, this
  // just keeps empty rows open while the admin types.
  const [transposeOpen, setTransposeOpen] = useState<Set<number>>(
    () =>
      new Set(
        (initial?.songs ?? [])
          .map((s, i) =>
            s.transposed_key.trim() ||
            s.transposed_bpm != null ||
            s.transposed_chords_text.trim() ||
            s.transposed_chords_image_url ||
            s.transposed_chords_url.trim()
              ? i
              : -1,
          )
          .filter((i) => i >= 0),
      ),
  );
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
        className={controlClass}
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

  // Remove a song and shift the index-keyed transpose-open set down to match.
  function removeSong(i: number) {
    setSongs((prev) => prev.filter((_, idx) => idx !== i));
    setTransposeOpen((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      }
      return next;
    });
  }

  // Reveal/hide a song's transpose inputs; hiding clears the transposed values
  // ("stick with the original").
  function toggleTranspose(i: number, on: boolean) {
    setTransposeOpen((prev) => {
      const next = new Set(prev);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
    if (!on)
      updateSong(i, {
        transposed_key: "",
        transposed_bpm: null,
        transposed_chords_text: "",
        transposed_chords_image_url: null,
        transposed_chords_url: "",
      });
  }

  async function uploadChordPhoto(
    i: number,
    file: File,
    field: "chords_image_url" | "transposed_chords_image_url",
  ) {
    // Uploads immediately on pick; saveService cleans up photos that are
    // replaced/removed before saving. A form abandoned after an upload (never
    // saved) leaves an orphan in the bucket — accepted as negligible here.
    setError(null);
    const key = `${i}:${field}`;
    setUploading((prev) => ({ ...prev, [key]: true }));
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chords")
      .upload(path, file, { contentType: file.type, upsert: false });
    setUploading((prev) => ({ ...prev, [key]: false }));
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      return;
    }
    updateSong(i, { [field]: path });
  }

  function submit() {
    setError(null);
    if (!date) {
      setError("Please pick the Sunday service date.");
      return;
    }
    if (
      songs.some(
        (s) =>
          (s.bpm != null && !(s.bpm > 0)) ||
          (s.transposed_bpm != null && !(s.transposed_bpm > 0)),
      )
    ) {
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
        <Input
          id="date"
          label="Sunday service date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          id="reh"
          label="Rehearsal date & time"
          type="datetime-local"
          value={rehearsal}
          onChange={(e) => setRehearsal(e.target.value)}
        />
        <Input
          id="loc"
          label="Rehearsal location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Church sanctuary"
        />
        <Select
          id="color"
          label="Color to wear"
          value={colorLabel}
          onChange={(e) => setColorLabel(e.target.value)}
        >
          <option value="">— None —</option>
          {WEAR_COLORS.map((c) => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </Select>
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
                    className="flex shrink-0 items-center justify-center rounded-xl border border-border px-3 text-muted"
                    aria-label="Remove backup singer"
                  >
                    <XIcon size={16} />
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
                  onClick={() => removeSong(i)}
                  className="text-sm text-muted"
                >
                  Remove
                </button>
              </div>
              <Input
                id={`song-${i}-title`}
                label="Song title"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.title}
                onChange={(e) => updateSong(i, { title: e.target.value })}
                placeholder="e.g. 10,000 Reasons"
              />
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Song leader
                </label>
                {memberSelect(song.song_leader_id, (v) =>
                  updateSong(i, { song_leader_id: v }),
                )}
              </div>
              <Input
                id={`song-${i}-author`}
                label="Author / artist"
                labelClassName="mb-1 block text-xs text-muted"
                list="song-authors"
                value={song.author}
                onChange={(e) => updateSong(i, { author: e.target.value })}
                placeholder="e.g. Matt Redman"
              />
              <Input
                id={`song-${i}-youtube`}
                label="YouTube link"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.youtube_url}
                onChange={(e) =>
                  updateSong(i, { youtube_url: e.target.value })
                }
                placeholder="Paste from the pastor"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id={`song-${i}-key`}
                    label="Original key"
                    labelClassName="mb-1 block text-xs text-muted"
                    value={song.song_key}
                    onChange={(e) =>
                      updateSong(i, { song_key: e.target.value })
                    }
                    placeholder="e.g. G"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id={`song-${i}-bpm`}
                    label="Original BPM"
                    labelClassName="mb-1 block text-xs text-muted"
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
                  />
                </div>
              </div>
              <Textarea
                id={`song-${i}-chords`}
                label="Original chords"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.chords_text}
                onChange={(e) =>
                  updateSong(i, { chords_text: e.target.value })
                }
                placeholder="Paste the chord chart here (optional)"
                rows={3}
                className="font-mono text-sm"
              />
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Original chord photo
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
                    disabled={uploading[`${i}:chords_image_url`]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        uploadChordPhoto(i, file, "chords_image_url");
                      e.target.value = "";
                    }}
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
                  />
                )}
                {uploading[`${i}:chords_image_url`] && (
                  <p className="mt-1 text-xs text-muted">Uploading photo…</p>
                )}
              </div>
              <Input
                id={`song-${i}-chords-url`}
                label="Original chords link"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.chords_url}
                onChange={(e) =>
                  updateSong(i, { chords_url: e.target.value })
                }
                placeholder="e.g. published chords URL"
              />
              <div className="space-y-3 rounded-xl border border-border p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={transposeOpen.has(i)}
                    onChange={(e) => toggleTranspose(i, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span>
                    Transpose for this service
                    <span className="block text-xs text-muted">
                      Played in a different key/tempo and chord chart than the
                      original.
                    </span>
                  </span>
                </label>
                {transposeOpen.has(i) && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          id={`song-${i}-tkey`}
                          label="Transposed key"
                          labelClassName="mb-1 block text-xs text-muted"
                          value={song.transposed_key}
                          onChange={(e) =>
                            updateSong(i, { transposed_key: e.target.value })
                          }
                          placeholder="e.g. A"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          id={`song-${i}-tbpm`}
                          label="Transposed BPM"
                          labelClassName="mb-1 block text-xs text-muted"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={song.transposed_bpm ?? ""}
                          onChange={(e) =>
                            updateSong(i, {
                              transposed_bpm: e.target.value.trim()
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          placeholder="e.g. 80"
                        />
                      </div>
                    </div>
                    <Textarea
                      id={`song-${i}-tchords`}
                      label="Transposed chords"
                      labelClassName="mb-1 block text-xs text-muted"
                      value={song.transposed_chords_text}
                      onChange={(e) =>
                        updateSong(i, {
                          transposed_chords_text: e.target.value,
                        })
                      }
                      placeholder="Paste the transposed chord chart here"
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <div>
                      <label className="mb-1 block text-xs text-muted">
                        Transposed chord photo
                      </label>
                      {song.transposed_chords_image_url ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              chordsImageUrl(
                                song.transposed_chords_image_url,
                              ) ?? ""
                            }
                            alt="Transposed chord chart"
                            className="h-20 w-20 rounded-lg border border-border object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSong(i, {
                                transposed_chords_image_url: null,
                              })
                            }
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
                          disabled={
                            uploading[`${i}:transposed_chords_image_url`]
                          }
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              uploadChordPhoto(
                                i,
                                file,
                                "transposed_chords_image_url",
                              );
                            e.target.value = "";
                          }}
                          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
                        />
                      )}
                      {uploading[`${i}:transposed_chords_image_url`] && (
                        <p className="mt-1 text-xs text-muted">
                          Uploading photo…
                        </p>
                      )}
                    </div>
                    <Input
                      id={`song-${i}-tchords-url`}
                      label="Transposed chords link"
                      labelClassName="mb-1 block text-xs text-muted"
                      value={song.transposed_chords_url}
                      onChange={(e) =>
                        updateSong(i, {
                          transposed_chords_url: e.target.value,
                        })
                      }
                      placeholder="e.g. published chords URL"
                    />
                  </>
                )}
              </div>
              <Textarea
                id={`song-${i}-lyrics`}
                label="Lyrics"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.lyrics}
                onChange={(e) => updateSong(i, { lyrics: e.target.value })}
                placeholder="Paste the song lyrics here (optional)"
                rows={4}
              />
              <Textarea
                id={`song-${i}-notes`}
                label="Notes"
                labelClassName="mb-1 block text-xs text-muted"
                value={song.notes}
                onChange={(e) => updateSong(i, { notes: e.target.value })}
                placeholder="Arrangement reminders, cues, capo, etc."
                rows={2}
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={song.save_to_book}
                  onChange={(e) =>
                    updateSong(i, { save_to_book: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  Save to song book
                  <span className="block text-xs text-muted">
                    Keeps the shared song-book entry in sync. Uncheck to keep
                    changes only on this service.
                  </span>
                </span>
              </label>
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
              className={controlClass}
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
        <Textarea
          id="notes"
          label="Notes for the team"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else (call time, reminders, etc.)"
        />
      </section>

      {error && <FormMessage>{error}</FormMessage>}

      <Button type="button" full onClick={submit} disabled={pending}>
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create schedule"}
      </Button>
      {cancelHref && (
        <Link
          href={cancelHref}
          className={buttonStyles({ variant: "ghost", full: true })}
        >
          Cancel
        </Link>
      )}
    </div>
  );
}
