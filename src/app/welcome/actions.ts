"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const instruments = formData.getAll("instruments").map(String);

  if (!fullName) return { error: "Please enter your name." };
  if (password.length < 6) {
    return { error: "Choose a password with at least 6 characters." };
  }

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) return { error: pwError.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, instruments })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  redirect("/");
}
