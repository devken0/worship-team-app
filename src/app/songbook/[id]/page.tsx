import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui";
import { MicIcon } from "@/components/icons";
import SongCard from "@/components/SongCard";
import { getLibrarySong, getSongPlayHistory } from "@/lib/library";
import { chordsImageUrl, formatServiceDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getLibrarySong(id);
  return { title: song ? song.title : "Song Book" };
}

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

  const history = await getSongPlayHistory(song);

  return (
    <>
      <PageHeader
        title="Song Book"
        back={{ href: "/songbook", label: "Back to song book" }}
      />
      <Page>
        <SongCard
          song={{
            title: song.title,
            category: song.default_category,
            youtube_url: song.youtube_url,
            originalChordsText: song.chords_text,
            originalChordsImageUrl: chordsImageUrl(song.chords_image_url),
            originalChordsUrl: song.chords_url,
            transposedChordsText: song.transposed_chords_text,
            transposedChordsImageUrl: chordsImageUrl(
              song.transposed_chords_image_url,
            ),
            transposedChordsUrl: song.transposed_chords_url,
            leaderName: null,
            author: song.author,
            originalKey: song.song_key,
            originalBpm: song.bpm,
            transposedKey: song.transposed_key,
            transposedBpm: song.transposed_bpm,
            notes: song.notes,
          }}
        />

        <SectionTitle>Played on ({history.length})</SectionTitle>
        {history.length === 0 ? (
          <EmptyState
            icon={<MicIcon size={24} />}
            title="Not played yet"
            hint="This fills in automatically as the song is scheduled into services."
          />
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <Card
                key={p.service_id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={`/schedule/${p.service_id}`}
                  className="font-medium text-primary"
                >
                  {formatServiceDate(p.service_date)}
                </Link>
                {p.recordingCount > 0 ? (
                  <Link
                    href={`/recordings/${p.service_id}`}
                    className="text-sm font-medium text-primary"
                  >
                    {p.recordingCount} recording
                    {p.recordingCount > 1 ? "s" : ""} ›
                  </Link>
                ) : (
                  <span className="text-sm text-muted">No recordings</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
