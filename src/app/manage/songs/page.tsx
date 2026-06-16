import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  Page,
  PageHeader,
  Card,
  SectionTitle,
  PrimaryLink,
  EmptyState,
} from "@/components/ui";
import { PlusIcon, MusicIcon } from "@/components/icons";
import { listLibrarySongs } from "@/lib/library";
import { SONG_CATEGORY_LABELS } from "@/lib/domain";

export default async function ManageSongsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const songs = await listLibrarySongs();

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
        <SectionTitle>Songs ({songs.length})</SectionTitle>
        {songs.length === 0 ? (
          <EmptyState
            icon={<MusicIcon size={24} />}
            title="No songs yet"
            hint="Tap “+ New” to add the first song to the book."
          />
        ) : (
          <div className="space-y-2">
            {songs.map((s) => (
              <Link
                key={s.id}
                href={`/manage/songs/${s.id}/edit`}
                className="block transition hover:-translate-y-0.5 active:scale-[0.98]"
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
                  <span className="shrink-0 text-muted">Edit ›</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
