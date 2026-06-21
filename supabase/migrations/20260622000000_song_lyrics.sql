-- Per-song lyrics. Unlike chords, lyrics are key-independent — the words don't
-- change when a song is transposed — so this is a single text column, not the
-- original/transposed pair the chord charts use (0011). Null means "no lyrics".
-- Mirrors across the song book (library_songs) and the per-service snapshot
-- table (songs). Text-only: no storage bucket, no RLS changes — it rides the
-- existing songs / library_songs policies like notes and chords_text.

alter table public.library_songs add column lyrics text;

alter table public.songs add column lyrics text;
