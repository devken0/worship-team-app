import {
  MULTI_ROLES,
  ROLE_LABELS,
  SINGLE_ROLES,
  SONG_CATEGORY_LABELS,
} from "@/lib/domain";
import { formatRehearsal, formatServiceDate } from "@/lib/format";
import type { ServiceDetail } from "@/lib/services";

/**
 * Build a plain-text Sunday reminder for a service, formatted for pasting into
 * the team's Messenger group chat. Mirrors the manual message the team posts
 * today so adopting the app stays familiar.
 *
 * Pure + synchronous so it can run in a Server Component; the result is handed
 * to the client ReminderButton for copy/share.
 */
export function buildServiceReminder(
  detail: ServiceDetail,
  siteUrl?: string,
): string {
  const { service, assignments, songs, names } = detail;
  const lines: string[] = [];

  lines.push(`🎵 Worship Team — ${formatServiceDate(service.service_date)}`);
  lines.push("");

  const rehearsal = formatRehearsal(service.rehearsal_at);
  lines.push(
    `⏰ Rehearsal: ${rehearsal ?? "To be announced"}` +
      (service.rehearsal_location ? ` @ ${service.rehearsal_location}` : ""),
  );
  if (service.wear_color_label || service.wear_color_hex) {
    lines.push(`👕 Wear: ${service.wear_color_label ?? service.wear_color_hex}`);
  }

  // Assignments, in the same display order the app uses elsewhere.
  const assignLines: string[] = [];
  for (const role of SINGLE_ROLES) {
    const a = assignments.find((x) => x.role_type === role);
    const name = a?.member_id ? names[a.member_id] : null;
    if (name) assignLines.push(`• ${ROLE_LABELS[role]}: ${name}`);
  }
  for (const role of MULTI_ROLES) {
    const people = assignments
      .filter((x) => x.role_type === role && x.member_id)
      .map((x) => names[x.member_id as string])
      .filter(Boolean);
    if (people.length) {
      assignLines.push(`• ${ROLE_LABELS[role]}: ${people.join(", ")}`);
    }
  }
  if (assignLines.length) {
    lines.push("");
    lines.push("Assignments:");
    lines.push(...assignLines);
  }

  // Songs in set order.
  if (songs.length) {
    lines.push("");
    lines.push("Songs:");
    songs.forEach((s, i) => {
      const leader = s.song_leader_id ? names[s.song_leader_id] : null;
      lines.push(
        `${i + 1}. [${SONG_CATEGORY_LABELS[s.category]}] ${s.title}` +
          (leader ? ` — led by ${leader}` : ""),
      );
    });
  }

  if (service.notes?.trim()) {
    lines.push("");
    lines.push(`📝 Notes: ${service.notes.trim()}`);
  }

  if (siteUrl) {
    lines.push("");
    lines.push(
      `Full details: ${siteUrl.replace(/\/$/, "")}/schedule/${service.id}`,
    );
  }

  return lines.join("\n");
}
