import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, SectionTitle, PrimaryLink } from "@/components/ui";
import { formatServiceDate } from "@/lib/format";
import type { Service } from "@/lib/domain";

export default async function ManagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, service_date, wear_color_label, wear_color_hex, rehearsal_at, rehearsal_location, notes")
    .order("service_date", { ascending: false })
    .limit(30);
  const services = (data ?? []) as Service[];

  return (
    <>
      <PageHeader
        title="Manage"
        action={<PrimaryLink href="/manage/service/new">+ New</PrimaryLink>}
      />
      <Page>
        <Link
          href="/manage/members"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm"
        >
          Members &amp; invitations
          <span className="text-muted">›</span>
        </Link>

        <SectionTitle>Schedules</SectionTitle>
        {services.length === 0 ? (
          <p className="text-sm text-muted">
            No schedules yet. Tap “+ New” to create the first one.
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <Link key={s.id} href={`/manage/service/${s.id}/edit`}>
                <Card className="flex items-center justify-between">
                  <span className="font-medium">
                    {formatServiceDate(s.service_date)}
                  </span>
                  <span className="text-muted">Edit ›</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
