"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/lib/domain";

export interface InviteState {
  error?: string;
  invited?: string;
}

export async function inviteMember(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  if (!(await isAdmin())) return { error: "Only admins can invite members." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const makeAdmin = formData.get("make_admin") === "on";

  if (!email) return { error: "Enter an email address." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl}/auth/confirm?next=/welcome`,
  });
  if (error) return { error: error.message };

  // Apply name + role to the profile the trigger just created.
  if (data.user) {
    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        role: makeAdmin ? "admin" : "member",
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/manage/members");
  return { invited: email };
}

export async function setMemberRole(
  memberId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "Only admins can change roles." };
  if (!memberId) return { error: "Missing member." };

  // Use the regular (RLS-enforced) client; admins are allowed to update profiles.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: role === "admin" ? "admin" : "member" })
    .eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath("/manage/members");
  return {};
}

export interface RemoveResult {
  error?: string;
  removed?: boolean;
}

/**
 * Remove a member: deletes the auth user, and the profile row drops via the
 * `on delete cascade` from auth.users. Their services/songs/recordings rows
 * survive with a null creator (every other FK to profiles is `set null`); any
 * recording files they left are reclaimed by the storage cleanup sweep.
 */
export async function removeMember(
  _prev: RemoveResult,
  formData: FormData,
): Promise<RemoveResult> {
  if (!(await isAdmin())) return { error: "Only admins can remove members." };
  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { error: "Missing member." };

  const me = await getCurrentUser();
  if (me?.id === memberId)
    return { error: "You can't remove your own account." };

  const admin = createAdminClient();

  // Never delete the last remaining admin.
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .maybeSingle();
  if (target?.role === "admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1)
      return { error: "Can't remove the last admin. Promote someone first." };
  }

  const { error } = await admin.auth.admin.deleteUser(memberId);
  if (error) return { error: error.message };

  revalidatePath("/manage/members");
  return { removed: true };
}
