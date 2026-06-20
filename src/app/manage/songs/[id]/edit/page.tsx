import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import HeaderAvatar from "@/components/HeaderAvatar";
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

export const metadata = { title: "Edit Song" };

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
    transposed_key: song.transposed_key,
    transposed_bpm: song.transposed_bpm,
    notes: song.notes,
    youtube_url: song.youtube_url,
    chords_text: song.chords_text,
    chords_image_url: song.chords_image_url,
    chords_url: song.chords_url,
    transposed_chords_text: song.transposed_chords_text,
    transposed_chords_image_url: song.transposed_chords_image_url,
    transposed_chords_url: song.transposed_chords_url,
  };

  return (
    <>
      <PageHeader
        title="Edit song"
        back={{ href: "/manage/songs", label: "Back to song book" }}
        avatar={<HeaderAvatar />}
      />
      <Page>
        <LibrarySongForm
          initial={initial}
          authors={authors}
          linkedServices={linkedServices}
          today={todayInManila()}
          cancelHref="/manage/songs"
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
