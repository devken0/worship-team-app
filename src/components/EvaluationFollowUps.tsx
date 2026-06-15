import { Card } from "@/components/ui";
import { NoteIcon } from "@/components/icons";

/**
 * Read-only carry-forward of last service's assignments and problems, shown
 * while prepping the next service and at the top of its evaluation minutes so
 * open items get followed up on. Pure presentational — callers fetch the data
 * via getPreviousFollowUps and pass an already-formatted dateLabel.
 */
export default function EvaluationFollowUps({
  dateLabel,
  actionItems,
  problems,
}: {
  dateLabel: string;
  actionItems: string;
  problems: string;
}) {
  return (
    <Card className="bg-amber-50">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <NoteIcon size={14} />
        Follow-ups from {dateLabel}
      </p>
      <div className="space-y-3">
        {actionItems && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Assignment/s
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{actionItems}</p>
          </div>
        )}
        {problems && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Problems to be solved
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{problems}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
