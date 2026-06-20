import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function RecordingsLoading() {
  return (
    <>
      <PageHeader
        title="Recordings"
        subtitle="Listen back & improve"
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
