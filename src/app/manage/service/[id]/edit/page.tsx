import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader } from "@/components/ui";
import ServiceForm, {
  type MemberOption,
  type ServiceFormInitial,
} from "@/components/ServiceForm";
import { deleteService } from "@/app/manage/service/actions";
import DeleteButton from "@/components/DeleteButton";
import { listLibrarySongs } from "@/lib/library";
import type { Assignment, Service, Song, AssignmentRole } from "@/lib/domain";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const [
    { data: service },
    { data: members },
    { data: assignments },
    { data: songs },
    librarySongs,
  ] = await Promise.all([
    supabase.from("services").select("*").eq("id", id).single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("assignments").select("*").eq("service_id", id),
    supabase.from("songs").select("*").eq("service_id", id).order("position"),
    listLibrarySongs(),
  ]);

  if (!service) notFound();
  const svc = service as Service;

  const singleRoles: Partial<Record<AssignmentRole, string | null>> = {};
  const backupSingers: string[] = [];
  for (const a of (assignments ?? []) as Assignment[]) {
    if (a.role_type === "backup_singer") {
      if (a.member_id) backupSingers.push(a.member_id);
    } else {
      singleRoles[a.role_type] = a.member_id;
    }
  }

  const initial: ServiceFormInitial = {
    id: svc.id,
    service_date: svc.service_date,
    rehearsal_at: svc.rehearsal_at,
    rehearsal_location: svc.rehearsal_location,
    wear_color_label: svc.wear_color_label,
    wear_color_hex: svc.wear_color_hex,
    notes: svc.notes,
    singleRoles,
    backupSingers,
    songs: ((songs ?? []) as Song[]).map((s) => ({
      title: s.title,
      category: s.category,
      song_leader_id: s.song_leader_id,
      author: s.author ?? "",
      song_key: s.song_key ?? "",
      bpm: s.bpm,
      notes: s.notes ?? "",
      youtube_url: s.youtube_url ?? "",
      chords_text: s.chords_text ?? "",
      chords_image_url: s.chords_image_url,
      chords_url: s.chords_url ?? "",
      library_song_id: s.library_song_id,
      save_to_book: true,
    })),
  };

  return (
    <>
      <PageHeader title="Edit schedule" />
      <Page>
        <ServiceForm
          members={(members ?? []) as MemberOption[]}
          librarySongs={librarySongs}
          initial={initial}
        />

        <div className="mt-8">
          <DeleteButton
            action={deleteService}
            fields={{ service_id: svc.id }}
            label="Delete this schedule"
            confirmTitle="Delete this schedule?"
            confirmMessage="This removes the service and all its assignments, songs, and chord photos. This can't be undone."
          />
        </div>
      </Page>
    </>
  );
}
