"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyRecordingReady } from "@/lib/notify";

/**
 * Fire after a recording row is inserted (the insert itself happens client-side
 * in the Recorder). Emails the service's assigned members. Best-effort and never
 * throws — the recording is already saved regardless of the mail outcome.
 */
export async function announceRecording(
  serviceId: string,
  title: string,
): Promise<void> {
  if (!serviceId) return;
  try {
    await notifyRecordingReady(serviceId, title || "New recording");
  } catch (err) {
    console.error("[announceRecording] notify failed:", err);
  }
}

export async function deleteRecording(formData: FormData) {
  const id = String(formData.get("recording_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("recordings")
    .select("storage_path, service_id")
    .eq("id", id)
    .single();

  // RLS restricts deletes to the owner or an admin; both the storage object
  // and the row are removed.
  if (data?.storage_path) {
    await supabase.storage.from("recordings").remove([data.storage_path]);
  }
  await supabase.from("recordings").delete().eq("id", id);

  if (data?.service_id) revalidatePath(`/recordings/${data.service_id}`);
  revalidatePath("/recordings");
}
