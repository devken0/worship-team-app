import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <>
      <PageHeader title="Profile" />
      <Page>
        <Card className="space-y-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </Card>
      </Page>
    </>
  );
}
