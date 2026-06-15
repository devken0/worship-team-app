-- Add an optional transposition on top of a song's original key/bpm. The
-- existing song_key/bpm columns (0006, song_musical_details) are now the
-- ORIGINAL values; transposed_key/transposed_bpm hold the team's performed
-- override when a song is played in a different key or tempo. Null means
-- "stick with the original". Mirrors across the song book (library_songs) and
-- the per-service snapshot table (songs): a scheduled song inherits the book's
-- transposition and can re-transpose for that Sunday.

alter table public.library_songs
  add column transposed_key text,
  add column transposed_bpm integer;

alter table public.songs
  add column transposed_key text,
  add column transposed_bpm integer;
