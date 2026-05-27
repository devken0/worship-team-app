import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import LibrarySongForm from "@/components/LibrarySongForm";

export default async function NewLibrarySongPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  return (
    <>
      <PageHeader title="New song" subtitle="Add to the song book" />
      <Page>
        <LibrarySongForm />
      </Page>
    </>
  );
}
