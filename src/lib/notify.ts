// Domain notification layer. SERVER-ONLY (uses the service-role admin client to
// read member emails out of auth.users — they are not on the profiles row).
//
// Every function here is fail-soft: it resolves recipients, sends, and returns a
// count, but never throws. Callers (server actions, the weekly cron route) treat
// notification as a side-effect that must not break the underlying save.
import { createAdminClient } from "@/lib/supabase/server";
import { getServiceDetail, getPublicServiceDetail } from "@/lib/services";
import { buildServiceReminder } from "@/lib/reminder";
import { sendEmail } from "@/lib/email";
import { ROLE_LABELS, type AssignmentRole } from "@/lib/domain";
import { formatServiceDate, formatRehearsal, todayInManila } from "@/lib/format";

type Admin = ReturnType<typeof createAdminClient>;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** id → email for every auth user, paginated (one page covers a church-sized team). */
async function authEmailMap(admin: Admin): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (error || users.length === 0) break;
    for (const u of users) if (u.email) map.set(u.id, u.email);
    if (users.length < perPage) break;
  }
  return map;
}

/**
 * Resolve the given member ids to a id → email map, keeping only members who are
 * onboarded and have not opted out of email. Pass no ids to resolve the whole
 * eligible roster (used by the weekly reminder).
 */
async function eligibleEmails(
  memberIds?: string[],
): Promise<Map<string, string>> {
  const admin = createAdminClient();

  let query = admin.from("profiles").select("id, onboarded, email_opt_out");
  if (memberIds) {
    const ids = [...new Set(memberIds.filter(Boolean))];
    if (ids.length === 0) return new Map();
    query = query.in("id", ids);
  }
  const { data: profiles } = await query;
  const eligible = new Set(
    (profiles ?? [])
      .filter((p) => p.onboarded && !p.email_opt_out)
      .map((p) => p.id as string),
  );
  if (eligible.size === 0) return new Map();

  const emails = await authEmailMap(admin);
  const out = new Map<string, string>();
  for (const id of eligible) {
    const email = emails.get(id);
    if (email) out.set(id, email);
  }
  return out;
}

/** Distinct member ids assigned to a service (drops unfilled roles). */
function assignedMemberIds(
  assignments: { member_id: string | null }[],
): string[] {
  return [
    ...new Set(
      assignments.map((a) => a.member_id).filter((id): id is string => !!id),
    ),
  ];
}

/**
 * Email each newly-assigned member their personal part for a service. Caller
 * passes only the (member, role) pairs that are NEW since the last save, so a
 * minor edit doesn't re-mail the whole band.
 */
export async function notifyAssignments(
  serviceId: string,
  newlyAssigned: { memberId: string; role: AssignmentRole }[],
): Promise<{ sent: number }> {
  if (newlyAssigned.length === 0) return { sent: 0 };
  const detail = await getServiceDetail(serviceId);
  if (!detail) return { sent: 0 };

  const rolesByMember = new Map<string, AssignmentRole[]>();
  for (const { memberId, role } of newlyAssigned) {
    const list = rolesByMember.get(memberId) ?? [];
    list.push(role);
    rolesByMember.set(memberId, list);
  }

  const emails = await eligibleEmails([...rolesByMember.keys()]);
  const dateLabel = formatServiceDate(detail.service.service_date);
  const rehearsal = formatRehearsal(detail.service.rehearsal_at);
  const wear =
    detail.service.wear_color_label ?? detail.service.wear_color_hex ?? null;
  const link = `${siteUrl()}/schedule/${serviceId}`;

  let sent = 0;
  for (const [memberId, roles] of rolesByMember) {
    const to = emails.get(memberId);
    if (!to) continue;
    const name = detail.names[memberId] ?? "";
    const roleList = roles.map((r) => ROLE_LABELS[r]).join(", ");

    const lines = [
      name ? `Hi ${name},` : "Hi,",
      "",
      `You're on the worship team for ${dateLabel}.`,
      "",
      `Your part: ${roleList}`,
      `Rehearsal: ${rehearsal ?? "To be announced"}` +
        (detail.service.rehearsal_location
          ? ` @ ${detail.service.rehearsal_location}`
          : ""),
    ];
    if (wear) lines.push(`Wear: ${wear}`);
    lines.push("", `Full details: ${link}`);

    const res = await sendEmail({
      to,
      subject: `You're scheduled for ${dateLabel}`,
      text: lines.join("\n"),
    });
    if (res.sent) sent++;
  }
  return { sent };
}

/**
 * Email the assigned members the action items and problems once evaluation
 * minutes are saved, so follow-ups land with the people who need to act on them.
 */
export async function notifyEvaluation(
  serviceId: string,
): Promise<{ sent: number }> {
  const detail = await getServiceDetail(serviceId);
  if (!detail?.evaluation) return { sent: 0 };

  const actionItems = detail.evaluation.action_items?.trim();
  const problems = detail.evaluation.problems?.trim();
  if (!actionItems && !problems) return { sent: 0 };

  const emails = await eligibleEmails(assignedMemberIds(detail.assignments));
  const to = [...emails.values()];
  if (to.length === 0) return { sent: 0 };

  const dateLabel = formatServiceDate(detail.service.service_date);
  const lines = [`Evaluation follow-ups from ${dateLabel}:`, ""];
  if (actionItems) lines.push("Assignments:", actionItems, "");
  if (problems) lines.push("Problems to solve:", problems, "");
  lines.push(`Full minutes: ${siteUrl()}/schedule/${serviceId}`);

  const res = await sendEmail({
    to,
    subject: `Follow-ups from ${dateLabel}`,
    text: lines.join("\n"),
  });
  return { sent: res.sent ? to.length : 0 };
}

/** Email the service's assigned members that a new recording is available. */
export async function notifyRecordingReady(
  serviceId: string,
  recordingTitle: string,
): Promise<{ sent: number }> {
  const detail = await getServiceDetail(serviceId);
  if (!detail) return { sent: 0 };

  const emails = await eligibleEmails(assignedMemberIds(detail.assignments));
  const to = [...emails.values()];
  if (to.length === 0) return { sent: 0 };

  const dateLabel = formatServiceDate(detail.service.service_date);
  const text = [
    `A new recording was added for ${dateLabel}.`,
    "",
    recordingTitle,
    "",
    `Listen: ${siteUrl()}/recordings/${serviceId}`,
  ].join("\n");

  const res = await sendEmail({
    to,
    subject: `New recording for ${dateLabel}`,
    text,
  });
  return { sent: res.sent ? to.length : 0 };
}

/**
 * Send the weekly reminder for the upcoming (or most recent) service to the whole
 * eligible roster. Reuses the same body the manual Messenger reminder posts, so
 * the email and the group chat read identically. Driven by the cron route.
 */
export async function sendWeeklyReminder(): Promise<{
  sent: number;
  recipients: number;
  skipped?: string;
}> {
  // Runs from the cron route with no user session, so resolve the target service
  // via the service-role client (RLS would hide everything from an anon read).
  const admin = createAdminClient();
  const today = todayInManila();
  const { data: upcoming } = await admin
    .from("services")
    .select("id")
    .gte("service_date", today)
    .order("service_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  let serviceId = upcoming?.id as string | undefined;
  if (!serviceId) {
    const { data: latest } = await admin
      .from("services")
      .select("id")
      .order("service_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    serviceId = latest?.id as string | undefined;
  }
  if (!serviceId) return { sent: 0, recipients: 0, skipped: "no-service" };

  const detail = await getPublicServiceDetail(serviceId);
  if (!detail) return { sent: 0, recipients: 0, skipped: "no-service" };

  const emails = await eligibleEmails();
  const to = [...emails.values()];
  if (to.length === 0) return { sent: 0, recipients: 0, skipped: "no-recipients" };

  const dateLabel = formatServiceDate(detail.service.service_date);
  const res = await sendEmail({
    to,
    subject: `Worship Team — ${dateLabel}`,
    text: buildServiceReminder(detail, siteUrl()),
  });
  return { sent: res.sent ? to.length : 0, recipients: to.length };
}
