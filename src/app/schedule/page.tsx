import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, EmptyState, PrimaryLink } from "@/components/ui";
import { ColorChip } from "@/components/ui";
import { formatServiceDate, todayInManila } from "@/lib/format";
import type { Service } from "@/lib/domain";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.profile?.role === "admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select(
      "id, service_date, wear_color_label, wear_color_hex, rehearsal_at, rehearsal_location, notes",
    )
    .order("service_date", { ascending: false });
  const services = (data ?? []) as Service[];

  const today = todayInManila();
  const upcoming = services
    .filter((s) => s.service_date >= today)
    .sort((a, b) => a.service_date.localeCompare(b.service_date));
  const past = services.filter((s) => s.service_date < today);

  const ServiceRow = ({ s }: { s: Service }) => (
    <Link key={s.id} href={`/schedule/${s.id}`}>
      <Card className="flex items-center justify-between gap-3">
        <span className="font-medium">{formatServiceDate(s.service_date)}</span>
        <ColorChip label={s.wear_color_label} hex={s.wear_color_hex} />
      </Card>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Schedule"
        action={
          isAdmin ? (
            <PrimaryLink href="/manage/service/new">+ New</PrimaryLink>
          ) : undefined
        }
      />
      <Page>
        {services.length === 0 ? (
          <EmptyState
            title="No schedules yet"
            hint={
              isAdmin
                ? "Tap “+ New” to create the first Sunday."
                : "The music director hasn't posted a schedule yet."
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
                  <ServiceRow key={s.id} s={s} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Past
                </h2>
                {past.map((s) => (
                  <ServiceRow key={s.id} s={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </Page>
    </>
  );
}
