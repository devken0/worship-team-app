import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, SectionTitle, EmptyState } from "@/components/ui";
import Recorder from "@/components/Recorder";
import RecordingItem, { type RecordingView } from "@/components/RecordingItem";
import { formatServiceDate } from "@/lib/format";
import type { Recording, Service } from "@/lib/domain";

export default async function ServiceRecordingsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.profile?.role === "admin";

  const supabase = await createClient();
  const [{ data: service }, { data: recs }] = await Promise.all([
    supabase
      .from("services")
      .select("id, service_date")
      .eq("id", serviceId)
      .single(),
    supabase
      .from("recordings")
      .select("*")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false }),
  ]);

  if (!service) notFound();
  const svc = service as Pick<Service, "id" | "service_date">;
  const recordings = (recs ?? []) as Recording[];

  // Generate signed URLs for uploaded audio (private bucket).
  const views: RecordingView[] = await Promise.all(
    recordings.map(async (r) => {
      let playUrl: string | null = null;
      if (r.storage_path) {
        const { data } = await supabase.storage
          .from("recordings")
          .createSignedUrl(r.storage_path, 60 * 60);
        playUrl = data?.signedUrl ?? null;
      }
      return {
        id: r.id,
        title: r.title,
        playUrl,
        external_url: r.external_url,
        duration_seconds: r.duration_seconds,
        canDelete: isAdmin || r.created_by === user.id,
      };
    }),
  );

  return (
    <>
      <PageHeader
        title="Recordings"
        subtitle={formatServiceDate(svc.service_date)}
      />
      <Page>
        <Recorder serviceId={svc.id} userId={user.id} />

        <SectionTitle>Saved recordings ({views.length})</SectionTitle>
        {views.length === 0 ? (
          <EmptyState
            title="No recordings yet"
            hint="Record the worship above, or add a link."
          />
        ) : (
          <div className="space-y-2">
            {views.map((v) => (
              <RecordingItem key={v.id} rec={v} />
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
