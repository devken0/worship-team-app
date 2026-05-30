-- Add musical-detail fields — author/artist, musical key, and tempo (bpm) — to
-- both the song book (library_songs, 0003) and the per-service snapshot table
-- (songs, 0001). The per-service columns let a song carry its key/bpm/author
-- onto a specific Sunday: copied from the book when picked, or typed for a
-- one-off blank song. `key` is a SQL reserved word, so the column is `song_key`.

alter table public.library_songs
  add column author   text,
  add column song_key text,
  add column bpm      integer;

alter table public.songs
  add column author   text,
  add column song_key text,
  add column bpm      integer;
