import { Page, PageHeader, Card, Skeleton } from "@/components/ui";

/** Generic loading placeholder for the admin create/edit form pages. */
export default function FormSkeleton({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back: { href: string; label?: string };
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} back={back} />
      <Page>
        <Card className="space-y-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-xl" />
        </Card>
      </Page>
    </>
  );
}
