import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServiceDetail } from "@/lib/services";
import { Page, PageHeader } from "@/components/ui";
import ServiceDetailView from "@/components/ServiceDetailView";
import { formatServiceDate } from "@/lib/format";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.profile?.role === "admin";

  const detail = await getServiceDetail(id);
  if (!detail) notFound();

  return (
    <>
      <PageHeader
        title={formatServiceDate(detail.service.service_date)}
        action={
          isAdmin ? (
            <Link
              href={`/manage/service/${id}/edit`}
              className="text-sm font-semibold text-primary"
            >
              Edit
            </Link>
          ) : undefined
        }
      />
      <Page>
        <ServiceDetailView
          detail={detail}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </Page>
    </>
  );
}
