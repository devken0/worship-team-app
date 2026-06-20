import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, PrimaryLink, EmptyState } from "@/components/ui";
import { PlusIcon, MusicIcon } from "@/components/icons";
import SongBookBrowser, { type BrowserSong } from "@/components/SongBookBrowser";
import { listLibrarySongs, getPlayStatsForLibrarySongs } from "@/lib/library";

export const metadata = { title: "Song Book" };

export default async function ManageSongsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

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
        subtitle="Reusable songs for scheduling"
        back={{ href: "/manage", label: "Back to manage" }}
        action={
          <PrimaryLink href="/manage/songs/new">
            <PlusIcon size={16} />
            New
          </PrimaryLink>
        }
      />
      <Page>
        {rows.length === 0 ? (
          <EmptyState
            icon={<MusicIcon size={24} />}
            title="No songs yet"
            hint="Tap “+ New” to add the first song to the book."
          />
        ) : (
          <SongBookBrowser songs={rows} mode="edit" />
        )}
      </Page>
    </>
  );
}
