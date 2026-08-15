-- Indexes for the lookups the app actually performs.
--
-- Every column here backs a query that runs on a page load and had no index:
--   * assignments.member_id  -> "what am I assigned to" on /schedule
--   * songs.song_leader_id   -> "songs I lead" on /schedule
--   * songs.library_song_id  -> play stats on /songbook (link match)
--   * songs.title            -> play stats on /songbook (title fallback match)
--   * library_songs.title    -> the alphabetical song-book listing
--
-- Deliberately NOT indexing the four `created_by` foreign keys that Supabase's
-- linter also reports. Nothing filters or joins on them; they'd only speed up
-- deleting a profile, which is rare and scans a few hundred rows at this size.
-- An index nobody queries is write cost and storage for nothing.

create index if not exists assignments_member_idx
  on public.assignments (member_id);

create index if not exists songs_song_leader_idx
  on public.songs (song_leader_id);

create index if not exists songs_library_song_idx
  on public.songs (library_song_id);

-- Play-stat matching falls back to a case-insensitive title comparison for
-- legacy songs saved before the library link existed, so the index has to be on
-- the lowered value to be usable.
create index if not exists songs_title_lower_idx
  on public.songs (lower(title));

create index if not exists library_songs_title_idx
  on public.library_songs (title);
