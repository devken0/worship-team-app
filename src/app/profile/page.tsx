import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, Card, SectionTitle } from "@/components/ui";
import ProfileForm from "@/components/ProfileForm";
import { signOut } from "./actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/welcome");

  return (
    <>
      <PageHeader title="Profile" subtitle={user.email ?? undefined} />
      <Page>
        {user.profile.role === "admin" && (
          <p className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Music Director / Admin
          </p>
        )}

        <Card>
          <ProfileForm profile={user.profile} />
        </Card>

        <SectionTitle>Account</SectionTitle>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base font-semibold text-red-600 active:opacity-90"
          >
            Sign out
          </button>
        </form>
      </Page>
    </>
  );
}
