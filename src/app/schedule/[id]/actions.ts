"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notifyEvaluation } from "@/lib/notify";

export interface EvaluationState {
  error?: string;
}

/**
 * Save (create or update) the evaluation minutes for a service. Allowed for an
 * admin or the member assigned the note_taker role. RLS is the real boundary;
 * this app-level check mirrors it and gives a clean failure.
 */
export async function saveEvaluation(
  _prev: EvaluationState,
  formData: FormData,
): Promise<EvaluationState> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return { error: "Missing service." };

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const isAdmin = user.profile?.role === "admin";
  if (!isAdmin) {
    const { data: noteTaker } = await supabase
      .from("assignments")
      .select("id")
      .eq("service_id", serviceId)
      .eq("role_type", "note_taker")
      .eq("member_id", user.id)
      .maybeSingle();
    if (!noteTaker) {
      return { error: "Only the note-taker or an admin can save these minutes." };
    }
  }

  const row = {
    service_id: serviceId,
    comments: String(formData.get("comments") ?? ""),
    recommendations: String(formData.get("recommendations") ?? ""),
    action_items: String(formData.get("action_items") ?? ""),
    problems: String(formData.get("problems") ?? ""),
    created_by: user.id,
  };

  const { error } = await supabase
    .from("evaluations")
    .upsert(row, { onConflict: "service_id" });
  if (error) return { error: error.message };

  // Email the assigned members the action items / problems. Best-effort.
  try {
    await notifyEvaluation(serviceId);
  } catch (notifyError) {
    console.error("[saveEvaluation] notify failed:", notifyError);
  }

  revalidatePath("/");
  revalidatePath(`/schedule/${serviceId}`);
  redirect(`/schedule/${serviceId}`);
}
