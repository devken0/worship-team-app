import { Page, PageHeader, EmptyState, PrimaryLink } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <Page>
        <EmptyState
          title="We couldn’t find that page"
          hint="The link may be broken or the page may have moved."
        />
        <div className="mt-4 flex justify-center">
          <PrimaryLink href="/">Go to This Sunday</PrimaryLink>
        </div>
      </Page>
    </>
  );
}
