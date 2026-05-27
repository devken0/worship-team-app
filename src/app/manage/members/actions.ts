"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

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

export async function setMemberRole(formData: FormData) {
  if (!(await isAdmin())) return;
  const memberId = String(formData.get("member_id") ?? "");
  const role = String(formData.get("role") ?? "member");
  if (!memberId) return;

  // Use the regular (RLS-enforced) client; admins are allowed to update profiles.
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: role === "admin" ? "admin" : "member" })
    .eq("id", memberId);

  revalidatePath("/manage/members");
}
