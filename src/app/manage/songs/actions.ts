"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import type { SongCategory } from "@/lib/domain";

export interface LibrarySongPayload {
  id?: string;
  title: string;
  default_category: SongCategory | null;
  /** Songwriter or original artist. */
  author: string;
  /** Musical key, e.g. "G" or "Bb". */
  song_key: string;
  /** Tempo in beats per minute, or null if unset. */
  bpm: number | null;
  youtube_url: string;
  chords_text: string;
  /** Storage path of the chord-chart photo in the `chords` bucket, or null. */
  chords_image_url: string | null;
  /** External link to published chords. */
  chords_url: string;
  /**
   * Service ids whose linked songs should receive this edit (only the fields
   * that actually changed). Empty/omitted = book-only edit, services untouched.
   */
  applyToServiceIds?: string[];
}

/**
 * Delete a chord photo from the public `chords` bucket, but only if no other
 * library entry and no per-service song still references the path. Library
 * entries and snapshot copies on `songs` rows can share a path, so a blind
 * remove() would orphan a photo that's still in use elsewhere.
 */
async function removeChordPhotoIfUnused(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
  exceptLibrarySongId?: string,
): Promise<void> {
  let libQuery = supabase
    .from("library_songs")
    .select("id")
    .eq("chords_image_url", path)
    .limit(1);
  if (exceptLibrarySongId) libQuery = libQuery.neq("id", exceptLibrarySongId);
  const [{ data: libRefs }, { data: songRefs }] = await Promise.all([
    libQuery,
    supabase
      .from("songs")
      .select("id")
      .eq("chords_image_url", path)
      .limit(1),
  ]);
  if ((libRefs?.length ?? 0) === 0 && (songRefs?.length ?? 0) === 0) {
    await supabase.storage.from("chords").remove([path]);
  }
}

/**
 * Song fields shared between a song-book entry and a per-service `songs` row,
 * eligible to propagate from the book to linked services. `default_category` is
 * intentionally excluded — a service's `category` is its own slot choice.
 */
const PROPAGATED_FIELDS = [
  "title",
  "author",
  "song_key",
  "bpm",
  "youtube_url",
  "chords_text",
  "chords_image_url",
  "chords_url",
] as const;

/**
 * Push a song-book edit to selected services' linked songs, but only the fields
 * that actually changed in this save — so a service that intentionally differs
 * on a field you didn't touch keeps its own value. Constrained by
 * `library_song_id` so only rows linked to this entry are updated. Replaced
 * chord photos on those rows are cleaned from the bucket if now unreferenced.
 */
async function applyEditToServices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  librarySongId: string,
  oldRow: Record<string, unknown> | null | undefined,
  newRow: Record<string, unknown>,
  serviceIds: string[] | undefined,
): Promise<void> {
  if (!serviceIds || serviceIds.length === 0) return;

  const changed: Record<string, unknown> = {};
  for (const f of PROPAGATED_FIELDS) {
    if ((oldRow?.[f] ?? null) !== (newRow[f] ?? null)) changed[f] = newRow[f] ?? null;
  }
  if (Object.keys(changed).length === 0) return;

  // Capture old photo paths on the affected service songs before overwriting,
  // so a replaced photo can be cleaned up afterward.
  let oldServicePaths: string[] = [];
  if ("chords_image_url" in changed) {
    const { data: affected } = await supabase
      .from("songs")
      .select("chords_image_url")
      .eq("library_song_id", librarySongId)
      .in("service_id", serviceIds);
    oldServicePaths = (affected ?? [])
      .map((s) => s.chords_image_url as string | null)
      .filter((p): p is string => !!p && p !== changed.chords_image_url);
  }

  const { error } = await supabase
    .from("songs")
    .update(changed)
    .eq("library_song_id", librarySongId)
    .in("service_id", serviceIds);
  if (error) throw new Error(error.message);

  for (const p of new Set(oldServicePaths)) {
    await removeChordPhotoIfUnused(supabase, p);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/manage");
  for (const id of serviceIds) revalidatePath(`/schedule/${id}`);
}

export async function saveLibrarySong(
  payload: LibrarySongPayload,
): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorized");
  const title = payload.title.trim();
  if (!title) throw new Error("Song title is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    title,
    default_category: payload.default_category,
    author: payload.author.trim() || null,
    song_key: payload.song_key.trim() || null,
    bpm: payload.bpm,
    youtube_url: payload.youtube_url.trim() || null,
    chords_text: payload.chords_text.trim() || null,
    chords_image_url: payload.chords_image_url || null,
    chords_url: payload.chords_url.trim() || null,
  };

  if (payload.id) {
    // Fetch the current row: serves both photo cleanup and the changed-field
    // diff used to propagate this edit to linked services.
    const { data: existing } = await supabase
      .from("library_songs")
      .select(
        "title, author, song_key, bpm, youtube_url, chords_text, chords_image_url, chords_url",
      )
      .eq("id", payload.id)
      .maybeSingle();
    const oldPath = (existing?.chords_image_url as string | null) ?? null;
    if (oldPath && oldPath !== row.chords_image_url) {
      await removeChordPhotoIfUnused(supabase, oldPath, payload.id);
    }
    const { error } = await supabase
      .from("library_songs")
      .update(row)
      .eq("id", payload.id);
    if (error) throw new Error(error.message);

    await applyEditToServices(
      supabase,
      payload.id,
      existing,
      row,
      payload.applyToServiceIds,
    );
  } else {
    const { error } = await supabase
      .from("library_songs")
      .insert({ ...row, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/songbook");
  revalidatePath("/manage/songs");
  redirect("/manage/songs");
}

export async function deleteLibrarySong(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("song_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: song } = await supabase
    .from("library_songs")
    .select("chords_image_url")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("library_songs").delete().eq("id", id);
  const path = song?.chords_image_url as string | null;
  if (path) await removeChordPhotoIfUnused(supabase, path, id);
  revalidatePath("/songbook");
  revalidatePath("/manage/songs");
  redirect("/manage/songs");
}
