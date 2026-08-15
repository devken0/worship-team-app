import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

/** Mirrors the song card + play-history shape of the song detail page. */
export default function SongDetailLoading() {
  return (
    <>
      <PageHeader
        title="Song Book"
        back={{ href: "/songbook", label: "Back to song book" }}
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <Card className="space-y-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>

        <Skeleton className="mt-6 mb-2 h-3 w-28" />
        <Card className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-40" />
          ))}
        </Card>
      </Page>
    </>
  );
}
