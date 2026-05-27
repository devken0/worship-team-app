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
