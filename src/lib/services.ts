import { createClient } from "@/lib/supabase/server";
import { todayInManila } from "@/lib/format";
import type { Assignment, Service, Song } from "@/lib/domain";

export interface ServiceDetail {
  service: Service;
  assignments: Assignment[];
  songs: Song[];
  /** member id → full name, for resolving assignment/leader names. */
  names: Record<string, string>;
}

async function buildNames(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name");
  const map: Record<string, string> = {};
  for (const p of data ?? []) {
    map[p.id] = (p.full_name as string) || "(no name)";
  }
  return map;
}

export async function getServiceDetail(
  id: string,
): Promise<ServiceDetail | null> {
  const supabase = await createClient();
  const [{ data: service }, { data: assignments }, { data: songs }, names] =
    await Promise.all([
      supabase.from("services").select("*").eq("id", id).single(),
      supabase.from("assignments").select("*").eq("service_id", id),
      supabase.from("songs").select("*").eq("service_id", id).order("position"),
      buildNames(),
    ]);

  if (!service) return null;
  return {
    service: service as Service,
    assignments: (assignments ?? []) as Assignment[],
    songs: (songs ?? []) as Song[],
    names,
  };
}

/** The next upcoming service (today or later, Manila time), else the latest past one. */
export async function getCurrentOrNextService(): Promise<ServiceDetail | null> {
  const supabase = await createClient();
  const today = todayInManila();

  const { data: upcoming } = await supabase
    .from("services")
    .select("id")
    .gte("service_date", today)
    .order("service_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let id = upcoming?.id as string | undefined;

  if (!id) {
    const { data: latest } = await supabase
      .from("services")
      .select("id")
      .order("service_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    id = latest?.id as string | undefined;
  }

  if (!id) return null;
  return getServiceDetail(id);
}
