import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function MembersLoading() {
  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Invite people and set roles"
        back={{ href: "/manage", label: "Back to manage" }}
      />
      <Page>
        <Card className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </Card>
        <Skeleton className="mb-2 mt-5 h-3 w-20" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </Card>
          ))}
        </div>
      </Page>
    </>
  );
}
