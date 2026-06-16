import type { Metadata } from "next";
import { Page, PageHeader, EmptyState } from "@/components/ui";
import { WifiOffIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <>
      <PageHeader title="You're offline" />
      <Page>
        <EmptyState
          icon={<WifiOffIcon size={24} />}
          title="No connection"
          hint="This page hasn't been opened yet, so it isn't saved for offline use. Reconnect to load it — pages you've already visited still work offline."
        />
      </Page>
    </>
  );
}
