import Link from "next/link";
import { Card, ColorChip, SectionTitle } from "@/components/ui";
import AssignmentsList from "@/components/AssignmentsList";
import SongCard from "@/components/SongCard";
import { chordsImageUrl, formatRehearsal } from "@/lib/format";
import type { ServiceDetail } from "@/lib/services";

export default function ServiceDetailView({
  detail,
  currentUserId,
}: {
  detail: ServiceDetail;
  currentUserId?: string;
}) {
  const { service, assignments, songs, evaluation, names } = detail;
  const rehearsal = formatRehearsal(service.rehearsal_at);

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Rehearsal
            </p>
            <p className="mt-0.5 font-medium">{rehearsal ?? "To be announced"}</p>
            {service.rehearsal_location && (
              <p className="text-sm text-muted">{service.rehearsal_location}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Wear
            </p>
            <div className="mt-1">
              <ColorChip
                label={service.wear_color_label}
                hex={service.wear_color_hex}
              />
            </div>
          </div>
        </div>
      </Card>

      {service.notes && (
        <Card className="bg-amber-50">
          <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
        </Card>
      )}

      <SectionTitle>Assignments</SectionTitle>
      <AssignmentsList
        assignments={assignments}
        names={names}
        currentUserId={currentUserId}
      />

      <SectionTitle>Songs</SectionTitle>
      {songs.length === 0 ? (
        <p className="text-sm text-muted">No songs added yet.</p>
      ) : (
        <div className="space-y-3">
          {songs.map((s) => (
            <SongCard
              key={s.id}
              song={{
                title: s.title,
                category: s.category,
                youtube_url: s.youtube_url,
                chords_text: s.chords_text,
                chordsImageUrl: chordsImageUrl(s.chords_image_url),
                chordsUrl: s.chords_url,
                leaderName: s.song_leader_id
                  ? (names[s.song_leader_id] ?? null)
                  : null,
              }}
            />
          ))}
        </div>
      )}

      <SectionTitle>Evaluation</SectionTitle>
      {evaluation ? (
        <Link
          href={`/schedule/${service.id}/evaluation`}
          className="block rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between font-medium">
            Meeting minutes
            <span className="text-muted">›</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {evaluation.comments.trim() || "Tap to view the minutes."}
          </p>
        </Link>
      ) : (
        <Link
          href={`/schedule/${service.id}/evaluation`}
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm"
        >
          Evaluation minutes
          <span className="text-muted">›</span>
        </Link>
      )}

      <SectionTitle>Recording</SectionTitle>
      <Link
        href={`/recordings/${service.id}`}
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm"
      >
        Recordings for this service
        <span className="text-muted">›</span>
      </Link>
    </div>
  );
}
