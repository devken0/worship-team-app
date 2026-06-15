import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function HomeLoading() {
  return (
    <>
      <PageHeader title={<Skeleton className="h-6 w-36" />} subtitle="This Sunday" />
      <Page>
        <Skeleton className="mb-3 h-32 w-full rounded-2xl" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
