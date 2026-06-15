import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getPreviousFollowUps,
  getServiceDetail,
  noteTakerId,
} from "@/lib/services";
import { Page, PageHeader, Card, EmptyState } from "@/components/ui";
import { NoteIcon } from "@/components/icons";
import EvaluationForm from "@/components/EvaluationForm";
import EvaluationFollowUps from "@/components/EvaluationFollowUps";
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

  const prev = await getPreviousFollowUps(service.service_date);
  const previousFollowUps = prev
    ? {
        dateLabel: formatServiceDate(prev.serviceDate),
        actionItems: prev.actionItems,
        problems: prev.problems,
      }
    : null;

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
            previousFollowUps={previousFollowUps}
          />
        ) : evaluation ? (
          <div className="space-y-4">
            {previousFollowUps && (
              <EvaluationFollowUps
                dateLabel={previousFollowUps.dateLabel}
                actionItems={previousFollowUps.actionItems}
                problems={previousFollowUps.problems}
              />
            )}
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
            icon={<NoteIcon size={24} />}
            title="No minutes yet"
            hint="Only the assigned note-taker or an admin can add these."
          />
        )}
      </Page>
    </>
  );
}
