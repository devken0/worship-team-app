import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

// Covers the whole /manage section (members, song book, schedule forms), so the
// header title is a neutral skeleton rather than a fixed label.
export default function ManageLoading() {
  return (
    <>
      <PageHeader
        title={<Skeleton className="h-6 w-32" />}
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-12" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
