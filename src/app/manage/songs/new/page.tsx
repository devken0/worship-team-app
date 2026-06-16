import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import LibrarySongForm from "@/components/LibrarySongForm";
import { listSongAuthors } from "@/lib/library";

export default async function NewLibrarySongPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const authors = await listSongAuthors();

  return (
    <>
      <PageHeader
        title="New song"
        subtitle="Add to the song book"
        back={{ href: "/manage/songs", label: "Back to song book" }}
      />
      <Page>
        <LibrarySongForm authors={authors} cancelHref="/manage/songs" />
      </Page>
    </>
  );
}
