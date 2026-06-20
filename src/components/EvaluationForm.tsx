"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveEvaluation, type EvaluationState } from "@/app/schedule/[id]/actions";
import { EVALUATION_SECTIONS, type Evaluation } from "@/lib/domain";
import { Button, buttonStyles, FormMessage } from "@/components/ui";
import { Textarea } from "@/components/form";
import EvaluationFollowUps from "@/components/EvaluationFollowUps";

const initial: EvaluationState = {};

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
  const [state, formAction, pending] = useActionState(saveEvaluation, initial);
  return (
    <form action={formAction} className="space-y-4">
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
        <Textarea
          key={key}
          id={key}
          name={key}
          label={label}
          labelClassName="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
          rows={5}
          defaultValue={evaluation?.[key] ?? ""}
        />
      ))}

      {state.error && <FormMessage>{state.error}</FormMessage>}

      <Button type="submit" full disabled={pending}>
        {pending ? "Saving…" : "Save minutes"}
      </Button>
      <Link
        href={`/schedule/${serviceId}`}
        className={buttonStyles({ variant: "ghost", full: true })}
      >
        Cancel
      </Link>
    </form>
  );
}
