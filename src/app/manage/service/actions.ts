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
  youtube_url: string;
  chords_text: string;
  /** Storage path of the chord-chart photo in the `chords` bucket, or null. */
  chords_image_url: string | null;
  /** External link to published chords. */
  chords_url: string;
  /** Song-book entry this song was copied from, or null for a one-off. */
  library_song_id: string | null;
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
      youtube_url: s.youtube_url.trim() || null,
      chords_text: s.chords_text.trim() || null,
      chords_image_url: s.chords_image_url || null,
      chords_url: s.chords_url.trim() || null,
      library_song_id: s.library_song_id || null,
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
