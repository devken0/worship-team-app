"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileState {
  error?: string;
  saved?: boolean;
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const instruments = formData.getAll("instruments").map(String);

  if (!fullName) return { error: "Please enter your name." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null, instruments })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
