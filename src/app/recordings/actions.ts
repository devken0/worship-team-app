"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
