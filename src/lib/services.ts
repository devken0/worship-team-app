import { createAdminClient, createClient } from "@/lib/supabase/server";
import { todayInManila } from "@/lib/format";
import type { Assignment, Evaluation, Service, Song } from "@/lib/domain";

export interface ServiceDetail {
  service: Service;
  assignments: Assignment[];
  songs: Song[];
  evaluation: Evaluation | null;
  /** member id → full name, for resolving assignment/leader names. */
  names: Record<string, string>;
}

/** The member id assigned the note_taker role for a service, if any. */
export function noteTakerId(assignments: Assignment[]): string | null {
  return (
    assignments.find((a) => a.role_type === "note_taker")?.member_id ?? null
  );
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
  const [
    { data: service },
    { data: assignments },
    { data: songs },
    { data: evaluation },
    names,
  ] = await Promise.all([
    supabase.from("services").select("*").eq("id", id).single(),
    supabase.from("assignments").select("*").eq("service_id", id),
    supabase.from("songs").select("*").eq("service_id", id).order("position"),
    supabase.from("evaluations").select("*").eq("service_id", id).maybeSingle(),
    buildNames(),
  ]);

  if (!service) return null;
  return {
    service: service as Service,
    assignments: (assignments ?? []) as Assignment[],
    songs: (songs ?? []) as Song[],
    evaluation: (evaluation as Evaluation) ?? null,
    names,
  };
}

/**
 * Read-only service detail for the PUBLIC, no-login share page (`/s/[id]`).
 * Uses the service-role client to bypass RLS, but deliberately exposes only the
 * fields the reminder already broadcasts — assignments, songs, schedule, notes —
 * and never evaluation or recordings. Names are resolved only for the members
 * this one service references, so no full roster leaks.
 */
export async function getPublicServiceDetail(
  id: string,
): Promise<ServiceDetail | null> {
  const supabase = createAdminClient();
  const [{ data: service }, { data: assignments }, { data: songs }] =
    await Promise.all([
      supabase
        .from("services")
        .select(
          "id, service_date, rehearsal_at, rehearsal_location, wear_color_label, wear_color_hex, notes",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("assignments")
        .select("id, service_id, role_type, member_id")
        .eq("service_id", id),
      supabase.from("songs").select("*").eq("service_id", id).order("position"),
    ]);

  if (!service) return null;

  const memberIds = new Set<string>();
  for (const a of (assignments ?? []) as Assignment[]) {
    if (a.member_id) memberIds.add(a.member_id);
  }
  for (const s of (songs ?? []) as Song[]) {
    if (s.song_leader_id) memberIds.add(s.song_leader_id);
  }

  const names: Record<string, string> = {};
  if (memberIds.size) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...memberIds]);
    for (const p of data ?? []) {
      names[p.id] = (p.full_name as string) || "(no name)";
    }
  }

  return {
    service: service as Service,
    assignments: (assignments ?? []) as Assignment[],
    songs: (songs ?? []) as Song[],
    evaluation: null,
    names,
  };
}

export interface PreviousFollowUps {
  serviceId: string;
  serviceDate: string;
  actionItems: string;
  problems: string;
}

/**
 * Open assignments and problems from the most recent prior service that has
 * evaluation minutes — surfaced while prepping the next service so they get
 * acted on instead of forgotten. Returns null when there is no earlier
 * evaluation, or that evaluation recorded no assignments or problems.
 */
export async function getPreviousFollowUps(
  beforeDate: string,
): Promise<PreviousFollowUps | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, service_date, evaluations!inner(action_items, problems)")
    .lt("service_date", beforeDate)
    .order("service_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string;
    service_date: string;
    evaluations:
      | { action_items: string | null; problems: string | null }
      | { action_items: string | null; problems: string | null }[]
      | null;
  };
  const ev = Array.isArray(row.evaluations)
    ? row.evaluations[0]
    : row.evaluations;
  const actionItems = (ev?.action_items ?? "").trim();
  const problems = (ev?.problems ?? "").trim();
  if (!actionItems && !problems) return null;

  return { serviceId: row.id, serviceDate: row.service_date, actionItems, problems };
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
