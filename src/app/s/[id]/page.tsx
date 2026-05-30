import { notFound } from "next/navigation";
import { Page, PageHeader } from "@/components/ui";
import PublicServiceView from "@/components/PublicServiceView";
import { getPublicServiceDetail } from "@/lib/services";
import { formatServiceDate } from "@/lib/format";

/**
 * Public, no-login schedule view — the target of the reminder's "Full details"
 * link. Added to the middleware public-path allowlist. Read-only; shows only
 * what the reminder already shares (never evaluation or recordings).
 */
export default async function PublicServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPublicServiceDetail(id);
  if (!detail) notFound();

  return (
    <>
      <PageHeader
        title={formatServiceDate(detail.service.service_date)}
        subtitle="Worship Team schedule"
      />
      <Page>
        <PublicServiceView detail={detail} />
      </Page>
    </>
  );
}
