import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function ScheduleLoading() {
  return (
    <>
      <PageHeader
        title="Schedule"
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <Skeleton className="mb-4 h-14 w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="mb-1 h-3 w-20" />
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
