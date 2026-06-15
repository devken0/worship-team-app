"use client";

import { useFormStatus } from "react-dom";
import { saveEvaluation } from "@/app/schedule/[id]/actions";
import { EVALUATION_SECTIONS, type Evaluation } from "@/lib/domain";
import { Button } from "@/components/ui";
import EvaluationFollowUps from "@/components/EvaluationFollowUps";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? "Saving…" : "Save minutes"}
    </Button>
  );
}

export default function EvaluationForm({
  serviceId,
  dateLabel,
  noteTakerName,
  evaluation,
  previousFollowUps,
}: {
  serviceId: string;
  dateLabel: string;
  noteTakerName: string;
  evaluation: Evaluation | null;
  previousFollowUps?: {
    dateLabel: string;
    actionItems: string;
    problems: string;
  } | null;
}) {
  return (
    <form action={saveEvaluation} className="space-y-4">
      <input type="hidden" name="service_id" value={serviceId} />

      {previousFollowUps && (
        <EvaluationFollowUps
          dateLabel={previousFollowUps.dateLabel}
          actionItems={previousFollowUps.actionItems}
          problems={previousFollowUps.problems}
        />
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
      </div>

      {EVALUATION_SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <label
            htmlFor={key}
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {label}
          </label>
          <textarea
            id={key}
            name={key}
            rows={5}
            defaultValue={evaluation?.[key] ?? ""}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-primary"
          />
        </div>
      ))}

      <SubmitButton />
    </form>
  );
}
