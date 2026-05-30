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
