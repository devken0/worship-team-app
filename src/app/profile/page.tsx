import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, Card, SectionTitle } from "@/components/ui";
import { ShieldIcon, LogOutIcon } from "@/components/icons";
import ProfileForm from "@/components/ProfileForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { signOut } from "./actions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/welcome");

  return (
    <>
      <PageHeader title="Profile" subtitle={user.email ?? undefined} />
      <Page>
        {user.profile.role === "admin" && (
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldIcon size={14} />
            Admin
          </p>
        )}

        <Card>
          <ProfileForm profile={user.profile} />
        </Card>

        <SectionTitle>Password</SectionTitle>
        <Card>
          <ChangePasswordForm />
        </Card>

        <SectionTitle>Account</SectionTitle>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-base font-semibold text-red-600 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LogOutIcon size={18} />
            Sign out
          </button>
        </form>
      </Page>
    </>
  );
}
