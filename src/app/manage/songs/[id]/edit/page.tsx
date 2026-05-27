import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import LibrarySongForm, {
  type LibrarySongFormInitial,
} from "@/components/LibrarySongForm";
import { getLibrarySong } from "@/lib/library";
import { deleteLibrarySong } from "@/app/manage/songs/actions";

export default async function EditLibrarySongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const song = await getLibrarySong(id);
  if (!song) notFound();

  const initial: LibrarySongFormInitial = {
    id: song.id,
    title: song.title,
    default_category: song.default_category,
    youtube_url: song.youtube_url,
    chords_text: song.chords_text,
    chords_image_url: song.chords_image_url,
    chords_url: song.chords_url,
  };

  return (
    <>
      <PageHeader title="Edit song" />
      <Page>
        <LibrarySongForm initial={initial} />

        <form action={deleteLibrarySong} className="mt-8">
          <input type="hidden" name="song_id" value={song.id} />
          <button
            type="submit"
            className="w-full rounded-xl border border-red-200 bg-card px-4 py-3 text-sm font-semibold text-red-600 active:opacity-90"
          >
            Delete this song
          </button>
        </form>
      </Page>
    </>
  );
}
