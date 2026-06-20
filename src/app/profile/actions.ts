"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileState {
  error?: string;
  saved?: boolean;
}

export interface PasswordState {
  error?: string;
  changed?: boolean;
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
  const instruments = formData.getAll("instruments").map(String);

  if (!fullName) return { error: "Please enter your name." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, instruments })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { saved: true };
}

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < 8) {
    return { error: "Choose a password with at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "Passwords don't match. Please re-enter them." };
  }
  if (!user.email) {
    return { error: "Your account has no email on file." };
  }

  // Verify the current password before allowing a change — guards against
  // someone changing it on an already-unlocked device.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verifyError) return { error: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };

  return { changed: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
