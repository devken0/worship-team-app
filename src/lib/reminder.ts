import {
  MULTI_ROLES,
  ROLE_LABELS,
  SINGLE_ROLES,
  SONG_CATEGORY_LABELS,
} from "@/lib/domain";
import { formatRehearsal, formatServiceDate } from "@/lib/format";
import type { ServiceDetail } from "@/lib/services";
import {
  esc,
  escMultiline,
  labeledRows,
  orderedList,
  paragraph,
  subheading,
} from "@/lib/email-template";

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
    lines.push(`Full details: ${siteUrl.replace(/\/$/, "")}/s/${service.id}`);
  }

  return lines.join("\n");
}

/**
 * The HTML body (inner card content, no surrounding layout) for the same Sunday
 * reminder — used by the branded notification email. Mirrors the section order
 * of buildServiceReminder so the email and the Messenger paste stay in step;
 * renderEmail() supplies the header, the "Full details" button, and the footer.
 */
export function buildServiceReminderHtml(detail: ServiceDetail): string {
  const { service, assignments, songs, names } = detail;
  const parts: string[] = [];

  parts.push(
    paragraph(`<strong>${esc(formatServiceDate(service.service_date))}</strong>`),
  );

  const rehearsal = formatRehearsal(service.rehearsal_at);
  const rows: { label: string; value: string }[] = [
    {
      label: "Rehearsal",
      value:
        esc(rehearsal ?? "To be announced") +
        (service.rehearsal_location
          ? ` @ ${esc(service.rehearsal_location)}`
          : ""),
    },
  ];
  if (service.wear_color_label || service.wear_color_hex) {
    rows.push({
      label: "Wear",
      value: esc(service.wear_color_label ?? service.wear_color_hex ?? ""),
    });
  }
  parts.push(labeledRows(rows));

  // Assignments, in the same display order the app uses elsewhere.
  const assignRows: { label: string; value: string }[] = [];
  for (const role of SINGLE_ROLES) {
    const a = assignments.find((x) => x.role_type === role);
    const name = a?.member_id ? names[a.member_id] : null;
    if (name) assignRows.push({ label: ROLE_LABELS[role], value: esc(name) });
  }
  for (const role of MULTI_ROLES) {
    const people = assignments
      .filter((x) => x.role_type === role && x.member_id)
      .map((x) => names[x.member_id as string])
      .filter(Boolean);
    if (people.length) {
      assignRows.push({
        label: ROLE_LABELS[role],
        value: esc(people.join(", ")),
      });
    }
  }
  if (assignRows.length) {
    parts.push(subheading("Assignments"));
    parts.push(labeledRows(assignRows));
  }

  if (songs.length) {
    parts.push(subheading("Songs"));
    parts.push(
      orderedList(
        songs.map((s) => {
          const leader = s.song_leader_id ? names[s.song_leader_id] : null;
          return (
            `<strong>${esc(s.title)}</strong> ` +
            `<span style="color:#857c6e;">[${esc(SONG_CATEGORY_LABELS[s.category])}]</span>` +
            (leader ? ` — led by ${esc(leader)}` : "")
          );
        }),
      ),
    );
  }

  if (service.notes?.trim()) {
    parts.push(subheading("Notes"));
    parts.push(paragraph(escMultiline(service.notes.trim()), { muted: true }));
  }

  return parts.join("\n");
}
