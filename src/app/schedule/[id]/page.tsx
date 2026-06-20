import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPreviousFollowUps, getServiceDetail } from "@/lib/services";
import { Page, PageHeader } from "@/components/ui";
import HeaderAvatar from "@/components/HeaderAvatar";
import ServiceDetailView from "@/components/ServiceDetailView";
import { formatServiceDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getServiceDetail(id);
  return {
    title: detail ? formatServiceDate(detail.service.service_date) : "Service",
  };
}

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

  const followUps = await getPreviousFollowUps(detail.service.service_date);

  return (
    <>
      <PageHeader
        title={formatServiceDate(detail.service.service_date)}
        back={{ href: "/schedule", label: "Back to schedule" }}
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
        avatar={<HeaderAvatar />}
      />
      <Page>
        <ServiceDetailView
          detail={detail}
          currentUserId={user.id}
          isAdmin={isAdmin}
          followUps={followUps}
        />
      </Page>
    </>
  );
}
