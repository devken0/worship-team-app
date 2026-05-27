import { deleteRecording } from "@/app/recordings/actions";
import { formatDuration } from "@/lib/format";
import DeleteButton from "@/components/DeleteButton";

export interface RecordingView {
  id: string;
  title: string;
  playUrl: string | null; // signed URL for uploaded audio
  external_url: string | null;
  duration_seconds: number | null;
  canDelete: boolean;
}

export default function RecordingItem({ rec }: { rec: RecordingView }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{rec.title}</p>
          {rec.duration_seconds ? (
            <p className="text-xs text-muted">
              {formatDuration(rec.duration_seconds)}
            </p>
          ) : null}
        </div>
        {rec.canDelete && (
          <DeleteButton
            action={deleteRecording}
            fields={{ recording_id: rec.id }}
            label="Delete"
            confirmTitle="Delete this recording?"
            confirmMessage={`"${rec.title}" will be permanently removed. This can't be undone.`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        )}
      </div>

      {rec.playUrl && (
        <audio controls preload="none" src={rec.playUrl} className="mt-3 w-full" />
      )}
      {!rec.playUrl && rec.external_url && (
        <a
          href={rec.external_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-medium text-primary"
        >
          Open recording ↗
        </a>
      )}
    </div>
  );
}
