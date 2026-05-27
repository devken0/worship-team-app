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
  youtube_url: string;
  chords_text: string;
  /** Storage path of the chord-chart photo in the `chords` bucket, or null. */
  chords_image_url: string | null;
  /** External link to published chords. */
  chords_url: string;
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
    youtube_url: payload.youtube_url.trim() || null,
    chords_text: payload.chords_text.trim() || null,
    chords_image_url: payload.chords_image_url || null,
    chords_url: payload.chords_url.trim() || null,
  };

  if (payload.id) {
    // Clean up a replaced/removed photo before overwriting the row.
    const { data: existing } = await supabase
      .from("library_songs")
      .select("chords_image_url")
      .eq("id", payload.id)
      .maybeSingle();
    const oldPath = existing?.chords_image_url as string | null;
    if (oldPath && oldPath !== row.chords_image_url) {
      await removeChordPhotoIfUnused(supabase, oldPath, payload.id);
    }
    const { error } = await supabase
      .from("library_songs")
      .update(row)
      .eq("id", payload.id);
    if (error) throw new Error(error.message);
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
