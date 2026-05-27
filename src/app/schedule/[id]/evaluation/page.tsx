import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServiceDetail, noteTakerId } from "@/lib/services";
import { Page, PageHeader, Card, EmptyState } from "@/components/ui";
import EvaluationForm from "@/components/EvaluationForm";
import { formatServiceDate } from "@/lib/format";
import { EVALUATION_SECTIONS } from "@/lib/domain";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const detail = await getServiceDetail(id);
  if (!detail) notFound();

  const { service, assignments, evaluation, names } = detail;
  const isAdmin = user.profile?.role === "admin";
  const takerId = noteTakerId(assignments);
  const canEdit = isAdmin || takerId === user.id;

  const dateLabel = formatServiceDate(service.service_date);
  const noteTakerName = takerId
    ? (names[takerId] ?? "—")
    : isAdmin
      ? (user.profile?.full_name || "—")
      : "Not assigned";

  return (
    <>
      <PageHeader title="Evaluation Minutes" subtitle={dateLabel} />
      <Page>
        {canEdit ? (
          <EvaluationForm
            serviceId={service.id}
            dateLabel={dateLabel}
            noteTakerName={noteTakerName}
            evaluation={evaluation}
          />
        ) : evaluation ? (
          <div className="space-y-4">
            <Card>
              <p className="text-base font-semibold">Minutes of the Meeting</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted">Date:</dt>
                  <dd className="font-medium">{dateLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">Note-taker:</dt>
                  <dd className="font-medium">{noteTakerName}</dd>
                </div>
              </dl>
            </Card>
            {EVALUATION_SECTIONS.map(({ key, label }) => (
              <div key={key}>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {label}
                </h2>
                <Card>
                  <p className="whitespace-pre-wrap text-sm">
                    {evaluation[key]?.trim() || "—"}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No minutes yet"
            hint="Only the assigned note-taker or an admin can add these."
          />
        )}
      </Page>
    </>
  );
}
