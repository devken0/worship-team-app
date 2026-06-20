import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/domain";

export interface CurrentUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

/** Returns the signed-in user with their profile, or null if signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, instruments, onboarded")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
  };
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.profile?.role === "admin";
}
