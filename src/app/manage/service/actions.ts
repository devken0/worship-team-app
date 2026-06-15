"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import type { AssignmentRole, SongCategory } from "@/lib/domain";

export interface SongInput {
  title: string;
  category: SongCategory;
  song_leader_id: string | null;
  /** Songwriter or original artist. */
  author: string;
  /** Original musical key, e.g. "G" or "Bb". */
  song_key: string;
  /** Original tempo in beats per minute, or null if unset. */
  bpm: number | null;
  /** Performed key when transposed off the original, or null to use the original. */
  transposed_key: string;
  /** Performed tempo when changed off the original, or null to use the original. */
  transposed_bpm: number | null;
  /** Free-text notes for the team. */
  notes: string;
  youtube_url: string;
  chords_text: string;
  /** Storage path of the chord-chart photo in the `chords` bucket, or null. */
  chords_image_url: string | null;
  /** External link to published chords. */
  chords_url: string;
  /** Song-book entry this song was copied from, or null for a one-off. */
  library_song_id: string | null;
  /**
   * When true (the default), write this song through to the song book on save:
   * create a book entry if none exists, otherwise update the linked/matched one,
   * and link this snapshot to it. Unchecked keeps the change local to this
   * service. Intent only — not persisted on the `songs` row.
   */
  save_to_book: boolean;
}

export interface ServicePayload {
  id?: string;
  service_date: string;
  rehearsal_at: string | null;
  rehearsal_location: string;
  wear_color_label: string;
  wear_color_hex: string;
  notes: string;
  /** Single-person roles keyed by role_type → member_id (or null). */
  singleRoles: Partial<Record<AssignmentRole, string | null>>;
  /** Backup singer member ids. */
  backupSingers: string[];
  songs: SongInput[];
}

export interface SaveResult {
  error?: string;
}

/**
 * Of the given chord-photo paths, return only those safe to delete from the
 * public `chords` bucket — i.e. not referenced by any song-book entry nor by
 * any song outside `exceptServiceId`. Snapshot copies on `songs` rows can share
 * a path with their library origin, so a blind remove() would delete a photo
 * that's still in use elsewhere.
 */
async function removableChordPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
  exceptServiceId: string,
): Promise<string[]> {
  const safe: string[] = [];
  for (const p of paths) {
    const [{ data: libRefs }, { data: otherSongs }] = await Promise.all([
      supabase.from("library_songs").select("id").eq("chords_image_url", p).limit(1),
      supabase
        .from("songs")
        .select("id")
        .eq("chords_image_url", p)
        .neq("service_id", exceptServiceId)
        .limit(1),
    ]);
    if ((libRefs?.length ?? 0) === 0 && (otherSongs?.length ?? 0) === 0) {
      safe.push(p);
    }
  }
  return safe;
}

/**
 * Write "Save to song book" songs through to the canonical song book and return
 * the resolved `library_song_id` for each song (keyed by the song object).
 *
 * For each filled song with `save_to_book`:
 *  - already linked → update that book entry (this is the back-edit / typo-fix);
 *  - unlinked but its title matches an existing entry (case-insensitive) → link
 *    to it WITHOUT overwriting (a typed-from-scratch song never rewrites a
 *    curated entry, and the match prevents a duplicate);
 *  - unlinked with no match → create a new entry.
 * Songs sharing a title in one save resolve to the same entry. Songs with
 * `save_to_book` off keep their existing link untouched and are not written to
 * the book. The snapshot copy on the `songs` row is updated separately by the
 * caller, so past and other services are never rewritten — only the shared book
 * row changes, and only ever the one a song is explicitly linked to.
 */
async function syncSongsToBook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  songs: SongInput[],
  userId: string | null,
): Promise<Map<SongInput, string | null>> {
  const links = new Map<SongInput, string | null>();
  const filled = songs.filter((s) => s.title.trim());
  for (const s of filled) links.set(s, s.library_song_id || null);

  const toBook = filled.filter((s) => s.save_to_book);
  if (toBook.length === 0) return links;

  // Small library: fetch all titles once for case-insensitive matching.
  const { data: existing } = await supabase
    .from("library_songs")
    .select("id, title");
  const byTitle = new Map<string, string>();
  for (const row of existing ?? []) {
    byTitle.set((row.title as string).toLowerCase(), row.id as string);
  }

  for (const s of toBook) {
    const title = s.title.trim();
    const fields = {
      title,
      default_category: s.category,
      author: s.author.trim() || null,
      song_key: s.song_key.trim() || null,
      bpm: s.bpm,
      transposed_key: s.transposed_key.trim() || null,
      transposed_bpm: s.transposed_bpm,
      notes: s.notes.trim() || null,
      youtube_url: s.youtube_url.trim() || null,
      chords_text: s.chords_text.trim() || null,
      chords_image_url: s.chords_image_url || null,
      chords_url: s.chords_url.trim() || null,
    };
    if (s.library_song_id) {
      // Already linked: push the current fields back to its book entry.
      const { error } = await supabase
        .from("library_songs")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", s.library_song_id);
      if (error) throw new Error(error.message);
      links.set(s, s.library_song_id);
      byTitle.set(title.toLowerCase(), s.library_song_id);
    } else {
      const matchId = byTitle.get(title.toLowerCase());
      if (matchId) {
        // Title matches a curated entry: link to it, leave its fields untouched.
        links.set(s, matchId);
      } else {
        // No match: create a new book entry and link to it.
        const { data, error } = await supabase
          .from("library_songs")
          .insert({ ...fields, created_by: userId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        const newId = data.id as string;
        links.set(s, newId);
        byTitle.set(title.toLowerCase(), newId);
      }
    }
  }

  return links;
}

export async function saveService(payload: ServicePayload): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorized");
  if (!payload.service_date) throw new Error("Service date is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const serviceRow = {
    service_date: payload.service_date,
    rehearsal_at: payload.rehearsal_at,
    rehearsal_location: payload.rehearsal_location || null,
    wear_color_label: payload.wear_color_label || null,
    wear_color_hex: payload.wear_color_hex || null,
    notes: payload.notes || null,
  };

  let serviceId = payload.id;

  if (serviceId) {
    const { error } = await supabase
      .from("services")
      .update(serviceRow)
      .eq("id", serviceId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("services")
      .insert({ ...serviceRow, created_by: user?.id ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    serviceId = data.id as string;
  }

  // Replace assignments: clear then re-insert the filled ones.
  await supabase.from("assignments").delete().eq("service_id", serviceId);
  const assignmentRows: {
    service_id: string;
    role_type: AssignmentRole;
    member_id: string;
  }[] = [];
  for (const [role, memberId] of Object.entries(payload.singleRoles)) {
    if (memberId) {
      assignmentRows.push({
        service_id: serviceId,
        role_type: role as AssignmentRole,
        member_id: memberId,
      });
    }
  }
  for (const memberId of payload.backupSingers) {
    if (memberId) {
      assignmentRows.push({
        service_id: serviceId,
        role_type: "backup_singer",
        member_id: memberId,
      });
    }
  }
  if (assignmentRows.length > 0) {
    const { error } = await supabase.from("assignments").insert(assignmentRows);
    if (error) throw new Error(error.message);
  }

  // Write "Save to song book" songs through to the canonical book and get back
  // the resolved library link for each (created, matched, or kept as-is).
  const bookLinks = await syncSongsToBook(supabase, payload.songs, user?.id ?? null);

  // Replace songs: clear then re-insert in order. The two chord fields ride
  // the song row like chords_text. First, delete any chord photos whose paths
  // are no longer referenced (photo removed or replaced), so the public
  // `chords` bucket doesn't accumulate orphans.
  const songRows = payload.songs
    .filter((s) => s.title.trim())
    .map((s, i) => ({
      service_id: serviceId!,
      title: s.title.trim(),
      category: s.category,
      position: i,
      song_leader_id: s.song_leader_id || null,
      author: s.author.trim() || null,
      song_key: s.song_key.trim() || null,
      bpm: s.bpm,
      transposed_key: s.transposed_key.trim() || null,
      transposed_bpm: s.transposed_bpm,
      notes: s.notes.trim() || null,
      youtube_url: s.youtube_url.trim() || null,
      chords_text: s.chords_text.trim() || null,
      chords_image_url: s.chords_image_url || null,
      chords_url: s.chords_url.trim() || null,
      library_song_id: bookLinks.get(s) ?? s.library_song_id ?? null,
    }));

  const keptPaths = new Set(
    songRows.map((r) => r.chords_image_url).filter(Boolean) as string[],
  );
  const { data: existingSongs } = await supabase
    .from("songs")
    .select("chords_image_url")
    .eq("service_id", serviceId);
  const removedPaths = (existingSongs ?? [])
    .map((s) => s.chords_image_url as string | null)
    .filter((p): p is string => !!p && !keptPaths.has(p));
  if (removedPaths.length > 0) {
    const safe = await removableChordPaths(supabase, removedPaths, serviceId);
    if (safe.length > 0) await supabase.storage.from("chords").remove(safe);
  }

  await supabase.from("songs").delete().eq("service_id", serviceId);
  if (songRows.length > 0) {
    const { error } = await supabase.from("songs").insert(songRows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath(`/schedule/${serviceId}`);
  revalidatePath("/manage");
  revalidatePath("/songbook");
  revalidatePath("/manage/songs");
  redirect(`/schedule/${serviceId}`);
}

export async function deleteService(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("service_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  // Remove chord photos for this service's songs before the cascade delete,
  // so they don't orphan in the public `chords` bucket.
  const { data: songs } = await supabase
    .from("songs")
    .select("chords_image_url")
    .eq("service_id", id);
  const paths = (songs ?? [])
    .map((s) => s.chords_image_url as string | null)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    const safe = await removableChordPaths(supabase, paths, id);
    if (safe.length > 0) await supabase.storage.from("chords").remove(safe);
  }
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/manage");
  redirect("/schedule");
}
