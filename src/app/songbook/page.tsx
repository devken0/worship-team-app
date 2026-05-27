import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Page, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui";
import { MusicIcon } from "@/components/icons";
import { listLibrarySongs } from "@/lib/library";
import { SONG_CATEGORY_LABELS } from "@/lib/domain";

export default async function SongBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const songs = await listLibrarySongs();

  return (
    <>
      <PageHeader title="Song Book" subtitle="Every song the team uses" />
      <Page>
        <SectionTitle>Songs ({songs.length})</SectionTitle>
        {songs.length === 0 ? (
          <EmptyState
            icon={<MusicIcon size={24} />}
            title="No songs yet"
            hint="The song book is empty for now."
          />
        ) : (
          <div className="space-y-2">
            {songs.map((s) => (
              <Link
                key={s.id}
                href={`/songbook/${s.id}`}
                className="block transition active:scale-[0.98]"
              >
                <Card className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {s.title}
                    </span>
                    {s.default_category && (
                      <span className="block text-xs text-muted">
                        {SONG_CATEGORY_LABELS[s.default_category]}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-muted">›</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
