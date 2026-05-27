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

  // Replace songs: clear then re-insert in order.
  await supabase.from("songs").delete().eq("service_id", serviceId);
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
    }));
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
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/manage");
  redirect("/schedule");
}
