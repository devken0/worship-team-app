-- Give a transposition its own chord chart. The existing chords_text /
-- chords_image_url / chords_url columns are now the ORIGINAL chords; these
-- transposed_* columns hold the chart for the performed (transposed) key — a
-- full mirror, since a chart in G isn't the chart in A. Null means "use the
-- original". Mirrors across the song book (library_songs) and the per-service
-- snapshot table (songs), like the transposed key/bpm columns (0009).

alter table public.library_songs
  add column transposed_chords_text      text,
  add column transposed_chords_image_url text,
  add column transposed_chords_url       text;

alter table public.songs
  add column transposed_chords_text      text,
  add column transposed_chords_image_url text,
  add column transposed_chords_url       text;
