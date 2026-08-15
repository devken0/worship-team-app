import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

/** Mirrors the shape of ServiceDetailView so the swap to real content is calm. */
export default function ServiceDetailLoading() {
  return (
    <>
      <PageHeader
        title={<Skeleton className="h-6 w-52" />}
        back={{ href: "/schedule", label: "Back to schedule" }}
        avatar={<Skeleton className="h-9 w-9 rounded-full" />}
      />
      <Page>
        <div className="space-y-3">
          {/* Rehearsal + wear */}
          <Card className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </Card>

          <Skeleton className="mt-6 mb-2 h-3 w-24" />
          <Card className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </Card>

          <Skeleton className="mt-6 mb-2 h-3 w-16" />
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Card key={i} className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        </div>
      </Page>
    </>
  );
}
