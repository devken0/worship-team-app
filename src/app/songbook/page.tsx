import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, EmptyState } from "@/components/ui";
import HeaderAvatar from "@/components/HeaderAvatar";
import { MusicIcon } from "@/components/icons";
import SongBookBrowser, { type BrowserSong } from "@/components/SongBookBrowser";
import { listLibrarySongs, getPlayStatsForLibrarySongs } from "@/lib/library";

export const metadata = { title: "Song Book" };

export default async function SongBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const songs = await listLibrarySongs();
  const stats = await getPlayStatsForLibrarySongs(songs);
  const rows: BrowserSong[] = songs.map((s) => ({
    id: s.id,
    title: s.title,
    author: s.author,
    category: s.default_category,
    count: stats.get(s.id)?.count ?? 0,
    lastPlayed: stats.get(s.id)?.lastPlayed ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Song Book"
        subtitle="Every song the team uses"
        avatar={<HeaderAvatar />}
      />
      <Page>
        {rows.length === 0 ? (
          <EmptyState
            icon={<MusicIcon size={24} />}
            title="No songs yet"
            hint="The song book is empty for now."
          />
        ) : (
          <SongBookBrowser songs={rows} mode="view" />
        )}
      </Page>
    </>
  );
}
