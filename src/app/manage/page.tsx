import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Page,
  PageHeader,
  Card,
  SectionTitle,
  PrimaryLink,
  EmptyState,
} from "@/components/ui";
import HeaderAvatar from "@/components/HeaderAvatar";
import { PlusIcon, CalendarIcon } from "@/components/icons";
import { formatServiceDate } from "@/lib/format";
import CleanupButton from "@/components/CleanupButton";
import { RECORDING_RETENTION_DAYS } from "@/lib/cleanup";
import type { Service } from "@/lib/domain";

export const metadata = { title: "Manage" };

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
        avatar={<HeaderAvatar />}
        action={
          <PrimaryLink href="/manage/service/new">
            <PlusIcon size={16} />
            New
          </PrimaryLink>
        }
      />
      <Page>
        <div className="space-y-2">
          <Link
            href="/manage/members"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Members &amp; invitations
            <span className="text-muted">›</span>
          </Link>
          <Link
            href="/manage/songs"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Song book
            <span className="text-muted">›</span>
          </Link>
        </div>

        <SectionTitle>Schedules</SectionTitle>
        {services.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon />}
            title="No schedules yet"
            hint="Tap “+ New” to create the first Sunday service."
          />
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/manage/service/${s.id}/edit`}
                className="block transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
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

        <SectionTitle>Maintenance</SectionTitle>
        <Card className="space-y-2">
          <p className="text-sm text-muted">
            Clears in-app recordings older than {RECORDING_RETENTION_DAYS} days
            plus any orphaned files, to keep storage within the free tier. Run
            it now to reclaim space immediately.
          </p>
          <CleanupButton />
          <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted">
            <span className="font-semibold">TODO — automate this:</span> cleanup
            is manual for now. Once the app is deployed (e.g. Vercel), set it to
            run weekly on its own so nobody has to remember. Steps are in the
            README under “Storage cleanup” (add <code>vercel.json</code> + a{" "}
            <code>CLEANUP_SECRET</code>).
          </p>
        </Card>
      </Page>
    </>
  );
}
