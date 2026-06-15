import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function SongBookLoading() {
  return (
    <>
      <PageHeader title="Song Book" subtitle="Every song the team uses" />
      <Page>
        <Skeleton className="mb-2 mt-5 h-3 w-16" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-3" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
