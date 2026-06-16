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

/** How often a song-book entry has been played, and when it was last played. */
export interface PlayStat {
  /** Distinct services this song has appeared in. */
  count: number;
  /** Service date (YYYY-MM-DD) of the most recent time played, or null. */
  lastPlayed: string | null;
}

/**
 * Play stats for every song-book entry, keyed by library-song id, in ONE query
 * over all per-service songs. Matches a play on the library link OR an exact
 * (case-insensitive) title — same rule as {@link getSongPlayHistory} — so legacy
 * one-off songs saved before the link still count. Feeds the song-book list's
 * "last played" line and the recency/frequency sorts.
 */
export async function getPlayStatsForLibrarySongs(
  songs: LibrarySong[],
): Promise<Map<string, PlayStat>> {
  const stats = new Map<string, PlayStat>();
  if (songs.length === 0) return stats;

  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("service_id, library_song_id, title, services(service_date)");

  type Row = {
    service_id: string;
    library_song_id: string | null;
    title: string | null;
    services: { service_date: string } | { service_date: string }[] | null;
  };

  // Index play rows by library id and by lowercased title for O(1) lookup.
  const byLibId = new Map<string, Row[]>();
  const byTitle = new Map<string, Row[]>();
  const push = (map: Map<string, Row[]>, key: string, row: Row) => {
    const arr = map.get(key);
    if (arr) arr.push(row);
    else map.set(key, [row]);
  };
  for (const row of (data ?? []) as unknown as Row[]) {
    if (row.library_song_id) push(byLibId, row.library_song_id, row);
    const t = row.title?.trim().toLowerCase();
    if (t) push(byTitle, t, row);
  }

  for (const song of songs) {
    const matches = [
      ...(byLibId.get(song.id) ?? []),
      ...(byTitle.get(song.title.trim().toLowerCase()) ?? []),
    ];
    // Dedupe by service so a song listed twice in one Sunday counts once.
    const dateByService = new Map<string, string>();
    for (const m of matches) {
      const svc = Array.isArray(m.services) ? m.services[0] : m.services;
      if (svc) dateByService.set(m.service_id, svc.service_date);
    }
    let lastPlayed: string | null = null;
    for (const d of dateByService.values()) {
      if (!lastPlayed || d > lastPlayed) lastPlayed = d;
    }
    stats.set(song.id, { count: dateByService.size, lastPlayed });
  }

  return stats;
}

/** A past Sunday a song was played, with how many recordings that service has. */
export interface SongPlay {
  service_id: string;
  service_date: string;
  recordingCount: number;
}

/** Past services where this song-book entry was played, newest first, each with
 *  its service's recording count. Matches per-service song rows on the library
 *  link OR an exact (case-insensitive) title so legacy/one-off songs saved before
 *  the library link still surface. Recordings are filed per-Sunday, so the count
 *  reflects that whole service, not just this song. */
export async function getSongPlayHistory(song: LibrarySong): Promise<SongPlay[]> {
  const supabase = await createClient();
  const [byLink, byTitle] = await Promise.all([
    supabase.from("songs").select("service_id").eq("library_song_id", song.id),
    supabase.from("songs").select("service_id").ilike("title", song.title),
  ]);

  const ids = Array.from(
    new Set([
      ...((byLink.data ?? []) as { service_id: string }[]).map((r) => r.service_id),
      ...((byTitle.data ?? []) as { service_id: string }[]).map((r) => r.service_id),
    ]),
  );
  if (ids.length === 0) return [];

  const [{ data: services }, { data: recs }] = await Promise.all([
    supabase
      .from("services")
      .select("id, service_date")
      .in("id", ids)
      .order("service_date", { ascending: false }),
    supabase.from("recordings").select("service_id").in("service_id", ids),
  ]);

  const counts = new Map<string, number>();
  for (const r of (recs ?? []) as { service_id: string }[]) {
    counts.set(r.service_id, (counts.get(r.service_id) ?? 0) + 1);
  }

  return ((services ?? []) as { id: string; service_date: string }[]).map((s) => ({
    service_id: s.id,
    service_date: s.service_date,
    recordingCount: counts.get(s.id) ?? 0,
  }));
}
