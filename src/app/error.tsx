"use client";

import { useEffect } from "react";
import { Page, PageHeader, EmptyState, Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging; replace with real reporting later.
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader title="Something went wrong" />
      <Page>
        <EmptyState
          title="That didn’t load as expected"
          hint="Try again, and if it keeps happening let an admin know."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Page>
    </>
  );
}
