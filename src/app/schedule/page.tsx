import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, EmptyState, PrimaryLink } from "@/components/ui";
import { ColorChip } from "@/components/ui";
import Paginated from "@/components/Paginated";
import HeaderAvatar from "@/components/HeaderAvatar";
import { PlusIcon, CalendarIcon } from "@/components/icons";
import { formatServiceDate, todayInManila } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/domain";
import type { AssignmentRole, Service } from "@/lib/domain";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.profile?.role === "admin";

  const supabase = await createClient();
  const [{ data }, { data: myAssignments }, { data: allSongs }] =
    await Promise.all([
      supabase
        .from("services")
        .select(
          "id, service_date, wear_color_label, wear_color_hex, rehearsal_at, rehearsal_location, notes",
        )
        .order("service_date", { ascending: false }),
      supabase
        .from("assignments")
        .select("service_id, role_type")
        .eq("member_id", user.id),
      supabase.from("songs").select("service_id, song_leader_id"),
    ]);
  const services = (data ?? []) as Service[];

  // service_id → this member's assignment roles
  const rolesByService: Record<string, AssignmentRole[]> = {};
  for (const a of myAssignments ?? []) {
    (rolesByService[a.service_id as string] ??= []).push(
      a.role_type as AssignmentRole,
    );
  }

  // service_id → total song count, and → songs this member leads
  const songCountByService: Record<string, number> = {};
  const leadCountByService: Record<string, number> = {};
  for (const song of allSongs ?? []) {
    const sid = song.service_id as string;
    songCountByService[sid] = (songCountByService[sid] ?? 0) + 1;
    if (song.song_leader_id === user.id) {
      leadCountByService[sid] = (leadCountByService[sid] ?? 0) + 1;
    }
  }

  // "Drummer • Song Leader (2)" or null when the member has nothing this service.
  const myRoleText = (serviceId: string): string | null => {
    const labels = (rolesByService[serviceId] ?? []).map((r) => ROLE_LABELS[r]);
    const leadCount = leadCountByService[serviceId] ?? 0;
    if (leadCount > 0) {
      labels.push(
        leadCount === 1 ? "Song Leader (1)" : `Song Leader (${leadCount})`,
      );
    }
    return labels.length ? labels.join(" • ") : null;
  };

  const today = todayInManila();
  const upcoming = services
    .filter((s) => s.service_date >= today)
    .sort((a, b) => a.service_date.localeCompare(b.service_date));
  const past = services.filter((s) => s.service_date < today);

  const ServiceRow = ({ s, enriched }: { s: Service; enriched?: boolean }) => {
    const roleText = enriched ? myRoleText(s.id) : null;
    const songCount = enriched ? (songCountByService[s.id] ?? 0) : null;
    return (
      <Link
        key={s.id}
        href={`/schedule/${s.id}`}
        className="block transition hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <Card className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-medium">
              {formatServiceDate(s.service_date)}
            </span>
            {enriched && (
              <p className="truncate text-sm text-muted">
                {roleText ? (
                  <>
                    <span className="text-foreground">You:</span> {roleText}
                  </>
                ) : (
                  "Not assigned"
                )}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <ColorChip label={s.wear_color_label} hex={s.wear_color_hex} />
            {enriched && (
              <span className="text-xs text-muted">
                {songCount === 0
                  ? "No songs yet"
                  : songCount === 1
                    ? "1 song"
                    : `${songCount} songs`}
              </span>
            )}
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <>
      <PageHeader
        title="Schedule"
        avatar={<HeaderAvatar />}
        action={
          isAdmin ? (
            <PrimaryLink href="/manage/service/new">
              <PlusIcon size={16} />
              New
            </PrimaryLink>
          ) : undefined
        }
      />
      <Page>
        {services.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={24} />}
            title="No schedules yet"
            hint={
              isAdmin
                ? "Tap “+ New” to create the first Sunday."
                : "An admin hasn't posted a schedule yet."
            }
          />
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Upcoming
                </h2>
                {upcoming.map((s) => (
                  <ServiceRow key={s.id} s={s} enriched />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Past
                </h2>
                <Paginated items={past.map((s) => <ServiceRow key={s.id} s={s} />)} />
              </div>
            )}
          </div>
        )}
      </Page>
    </>
  );
}
