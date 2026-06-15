import { Card, ColorChip, SectionTitle } from "@/components/ui";
import { ClockIcon, MapPinIcon, ShirtIcon, NoteIcon } from "@/components/icons";
import AssignmentsList from "@/components/AssignmentsList";
import SongCard from "@/components/SongCard";
import { chordsImageUrl, formatRehearsal } from "@/lib/format";
import type { ServiceDetail } from "@/lib/services";

/**
 * Read-only schedule for the public, no-login share page. Mirrors what the
 * reminder broadcasts (schedule, assignments, songs, notes) and deliberately
 * omits evaluation, recordings, and any edit/admin controls.
 */
export default function PublicServiceView({
  detail,
}: {
  detail: ServiceDetail;
}) {
  const { service, assignments, songs, names } = detail;
  const rehearsal = formatRehearsal(service.rehearsal_at);

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ClockIcon size={14} />
              Rehearsal
            </p>
            <p className="mt-0.5 font-medium">{rehearsal ?? "To be announced"}</p>
            {service.rehearsal_location && (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <MapPinIcon size={14} />
                {service.rehearsal_location}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ShirtIcon size={14} />
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

      <SectionTitle>Assignments</SectionTitle>
      <AssignmentsList assignments={assignments} names={names} />

      {service.notes && (
        <Card className="bg-amber-50">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <NoteIcon size={14} />
            Notes
          </p>
          <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
        </Card>
      )}

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
                author: s.author,
                songKey: s.song_key,
                bpm: s.bpm,
                notes: s.notes,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
