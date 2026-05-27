import { deleteRecording } from "@/app/recordings/actions";
import { formatDuration } from "@/lib/format";

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
          <form action={deleteRecording}>
            <input type="hidden" name="recording_id" value={rec.id} />
            <button
              type="submit"
              className="shrink-0 text-xs font-medium text-red-600"
            >
              Delete
            </button>
          </form>
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
