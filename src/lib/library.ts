import { createClient } from "@/lib/supabase/server";
import type { LibrarySong } from "@/lib/domain";

/** All song-book entries, alphabetical by title (case-insensitive). */
export async function listLibrarySongs(): Promise<LibrarySong[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_songs")
    .select("*")
    .order("title");
  return (data ?? []) as LibrarySong[];
}

/** Distinct, non-empty authors used in the song book, alphabetical — feeds the
 *  author autocomplete on the song and service forms. */
export async function listSongAuthors(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_songs")
    .select("author")
    .not("author", "is", null);
  const authors = new Set(
    (data ?? [])
      .map((r) => (r.author as string | null)?.trim())
      .filter((a): a is string => !!a),
  );
  return Array.from(authors).sort((a, b) => a.localeCompare(b));
}

/** A single song-book entry, or null if not found. */
export async function getLibrarySong(id: string): Promise<LibrarySong | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_songs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as LibrarySong) ?? null;
}

/** A service that links to a song-book entry via one of its songs. */
export interface LinkedService {
  service_id: string;
  service_date: string;
}

/** Distinct services whose songs link to the given song-book entry, newest
 *  first — feeds the "Used in N services" list on the song edit page. */
export async function listServicesForLibrarySong(
  librarySongId: string,
): Promise<LinkedService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("service_id, services(service_date)")
    .eq("library_song_id", librarySongId);
  const byId = new Map<string, LinkedService>();
  for (const row of (data ?? []) as unknown as {
    service_id: string;
    services: { service_date: string } | { service_date: string }[] | null;
  }[]) {
    const svc = Array.isArray(row.services) ? row.services[0] : row.services;
    if (!svc || byId.has(row.service_id)) continue;
    byId.set(row.service_id, {
      service_id: row.service_id,
      service_date: svc.service_date,
    });
  }
  return Array.from(byId.values()).sort((a, b) =>
    b.service_date.localeCompare(a.service_date),
  );
}
