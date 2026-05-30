import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import LibrarySongForm, {
  type LibrarySongFormInitial,
} from "@/components/LibrarySongForm";
import {
  getLibrarySong,
  listSongAuthors,
  listServicesForLibrarySong,
} from "@/lib/library";
import { deleteLibrarySong } from "@/app/manage/songs/actions";
import { todayInManila } from "@/lib/format";
import DeleteButton from "@/components/DeleteButton";

export default async function EditLibrarySongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const [song, authors, linkedServices] = await Promise.all([
    getLibrarySong(id),
    listSongAuthors(),
    listServicesForLibrarySong(id),
  ]);
  if (!song) notFound();

  const initial: LibrarySongFormInitial = {
    id: song.id,
    title: song.title,
    default_category: song.default_category,
    author: song.author,
    song_key: song.song_key,
    bpm: song.bpm,
    youtube_url: song.youtube_url,
    chords_text: song.chords_text,
    chords_image_url: song.chords_image_url,
    chords_url: song.chords_url,
  };

  return (
    <>
      <PageHeader title="Edit song" />
      <Page>
        <LibrarySongForm
          initial={initial}
          authors={authors}
          linkedServices={linkedServices}
          today={todayInManila()}
        />

        <div className="mt-8">
          <DeleteButton
            action={deleteLibrarySong}
            fields={{ song_id: song.id }}
            label="Delete this song"
            confirmTitle="Delete this song?"
            confirmMessage="This removes the song from the library. Schedules that already used it keep their copy. This can't be undone."
          />
        </div>
      </Page>
    </>
  );
}
