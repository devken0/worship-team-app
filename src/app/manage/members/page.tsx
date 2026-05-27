import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, SectionTitle } from "@/components/ui";
import InviteForm from "@/components/InviteForm";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import { setMemberRole } from "./actions";
import type { Profile } from "@/lib/domain";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, instruments, phone")
    .order("full_name");
  const members = (data ?? []) as Profile[];

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
          {members.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {m.full_name || "(no name yet)"}
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
                <form action={setMemberRole}>
                  <input type="hidden" name="member_id" value={m.id} />
                  <input
                    type="hidden"
                    name="role"
                    value={m.role === "admin" ? "member" : "admin"}
                  />
                  <button
                    type="submit"
                    disabled={m.id === user.id}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                      m.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "border border-border text-muted"
                    }`}
                    title={
                      m.id === user.id
                        ? "You can't change your own role"
                        : m.role === "admin"
                          ? "Tap to make member"
                          : "Tap to make admin"
                    }
                  >
                    {m.role === "admin" ? "Admin" : "Member"}
                  </button>
                </form>
                <RemoveMemberButton
                  memberId={m.id}
                  name={m.full_name || "this member"}
                  disabled={m.id === user.id}
                />
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
