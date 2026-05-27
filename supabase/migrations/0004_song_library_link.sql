-- 0004_song_library_link.sql
-- Links a per-service song back to its song-book origin. The link is a pointer
-- only: a service song keeps its own snapshot copy of title/category/chords, so
-- editing the library entry never rewrites past services. One-off songs typed
-- straight into the service form keep library_song_id = null. RLS is unchanged.

alter table public.songs
  add column if not exists library_song_id uuid
  references public.library_songs (id) on delete set null;
