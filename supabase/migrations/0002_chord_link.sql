-- 0002_chord_link.sql
-- Per-song chord references: a clickable link to externally-published chords,
-- alongside the existing inline chords_text and a photo of the chord chart.

-- One clickable link to externally-published chords, per song.
alter table public.songs add column if not exists chords_url text;

-- songs.chords_image_url already exists (0001); it now stores the photo's path
-- in the public 'chords' storage bucket. Resolve it to a public URL at render.
-- The 'chords' bucket policies (admin-write, public-read) and songs RLS from
-- 0001 stay UNCHANGED — chords remain admin-managed in the service form.
