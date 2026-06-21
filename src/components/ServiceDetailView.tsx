import Link from "next/link";
import { Card, ColorChip, SectionTitle } from "@/components/ui";
import { ClockIcon, MapPinIcon, ShirtIcon, NoteIcon } from "@/components/icons";
import AssignmentsList from "@/components/AssignmentsList";
import SongCard, { type SongCardData } from "@/components/SongCard";
import RehearsalButton from "@/components/RehearsalButton";
import ReminderButton from "@/components/ReminderButton";
import EvaluationFollowUps from "@/components/EvaluationFollowUps";
import { chordsImageUrl, formatRehearsal, formatServiceDate } from "@/lib/format";
import { buildServiceReminder } from "@/lib/reminder";
import type { PreviousFollowUps, ServiceDetail } from "@/lib/services";

export default function ServiceDetailView({
  detail,
  currentUserId,
  isAdmin = false,
  followUps = null,
}: {
  detail: ServiceDetail;
  currentUserId?: string;
  isAdmin?: boolean;
  followUps?: PreviousFollowUps | null;
}) {
  const { service, assignments, songs, evaluation, names } = detail;
  const rehearsal = formatRehearsal(service.rehearsal_at);

  // Built once and reused for both the song cards and the rehearsal viewer so
  // the "performed key/tempo/chords" stays identical between them.
  const songCards: { id: string; data: SongCardData }[] = songs.map((s) => ({
    id: s.id,
    data: {
      title: s.title,
      category: s.category,
      youtube_url: s.youtube_url,
      originalChordsText: s.chords_text,
      originalChordsImageUrl: chordsImageUrl(s.chords_image_url),
      originalChordsUrl: s.chords_url,
      transposedChordsText: s.transposed_chords_text,
      transposedChordsImageUrl: chordsImageUrl(s.transposed_chords_image_url),
      transposedChordsUrl: s.transposed_chords_url,
      leaderName: s.song_leader_id ? (names[s.song_leader_id] ?? null) : null,
      author: s.author,
      originalKey: s.song_key,
      originalBpm: s.bpm,
      transposedKey: s.transposed_key,
      transposedBpm: s.transposed_bpm,
      notes: s.notes,
      lyrics: s.lyrics,
    },
  }));
  const reminderText = isAdmin
    ? buildServiceReminder(detail, process.env.NEXT_PUBLIC_SITE_URL)
    : null;

  return (
    <div className="space-y-3">
      {reminderText && <ReminderButton text={reminderText} />}
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

      {followUps && (
        <EvaluationFollowUps
          dateLabel={formatServiceDate(followUps.serviceDate)}
          actionItems={followUps.actionItems}
          problems={followUps.problems}
        />
      )}

      <SectionTitle>Assignments</SectionTitle>
      <AssignmentsList
        assignments={assignments}
        names={names}
        currentUserId={currentUserId}
      />

      {service.notes && (
        <Card className="bg-brand-soft">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <NoteIcon size={14} />
            Notes
          </p>
          <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
        </Card>
      )}

      <SectionTitle>Songs</SectionTitle>
      {songCards.length === 0 ? (
        <p className="text-sm text-muted">No songs added yet.</p>
      ) : (
        <div className="space-y-3">
          <RehearsalButton
            songs={songCards.map((c) => c.data)}
            title={formatServiceDate(service.service_date)}
          />
          {songCards.map((c) => (
            <SongCard key={c.id} song={c.data} />
          ))}
        </div>
      )}

      <SectionTitle>Evaluation</SectionTitle>
      {evaluation ? (
        <Link
          href={`/schedule/${service.id}/evaluation`}
          className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98]"
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
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98]"
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
