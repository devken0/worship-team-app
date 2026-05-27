import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, SectionTitle } from "@/components/ui";
import InviteForm from "@/components/InviteForm";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import MemberRoleButton from "@/components/MemberRoleButton";
import type { Profile } from "@/lib/domain";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, instruments")
    .order("full_name");
  const members = (data ?? []) as Profile[];

  // Emails live in auth.users, not profiles. Fetch them so admins can still
  // identify people who haven't finished onboarding (and so have no name yet).
  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailById = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));

  return (
    <>
      <PageHeader title="Members" subtitle="Invite people and set roles" />
      <Page>
        <Card>
          <h2 className="mb-3 font-semibold">Invite a new member</h2>
          <InviteForm />
          <p className="mt-3 text-xs text-muted">
            They&apos;ll get an email with a link to set their password and
            finish their profile.
          </p>
        </Card>

        <SectionTitle>Team ({members.length})</SectionTitle>
        <div className="space-y-2">
          {members.map((m) => {
            const email = emailById.get(m.id) ?? "";
            const label = m.full_name || email || "(no name yet)";
            return (
              <Card
                key={m.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {label}
                    {m.id === user.id && (
                      <span className="ml-1 text-xs text-muted">(you)</span>
                    )}
                  </p>
                  {m.instruments.length > 0 && (
                    <p className="truncate text-xs text-muted">
                      {m.instruments.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <MemberRoleButton
                    memberId={m.id}
                    name={m.full_name || email || "this member"}
                    role={m.role}
                    isSelf={m.id === user.id}
                  />
                  <RemoveMemberButton
                    memberId={m.id}
                    name={m.full_name || email || "this member"}
                    disabled={m.id === user.id}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </Page>
    </>
  );
}
