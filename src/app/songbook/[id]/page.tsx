import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader } from "@/components/ui";
import SongCard from "@/components/SongCard";
import { getLibrarySong } from "@/lib/library";
import { chordsImageUrl } from "@/lib/format";

export default async function SongBookEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const song = await getLibrarySong(id);
  if (!song) notFound();

  return (
    <>
      <PageHeader title="Song Book" />
      <Page>
        <Link
          href="/songbook"
          className="mb-3 inline-block text-sm font-medium text-primary"
        >
          ‹ Back to song book
        </Link>
        <SongCard
          song={{
            title: song.title,
            category: song.default_category,
            youtube_url: song.youtube_url,
            chords_text: song.chords_text,
            chordsImageUrl: chordsImageUrl(song.chords_image_url),
            chordsUrl: song.chords_url,
            leaderName: null,
            author: song.author,
            songKey: song.song_key,
            bpm: song.bpm,
          }}
        />
      </Page>
    </>
  );
}
