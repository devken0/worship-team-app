import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

/** Mirrors the recorder panel + recordings list of the service recordings page. */
export default function ServiceRecordingsLoading() {
  return (
    <>
      <PageHeader
        title="Recordings"
        subtitle=" "
        back={{ href: "/recordings", label: "Back to recordings" }}
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <Card className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-4 w-52" />
        </Card>

        <Skeleton className="mt-6 mb-2 h-3 w-24" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
