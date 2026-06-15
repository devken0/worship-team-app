-- Add a free-text notes field to both the song book and per-service songs.
-- Mirrors the author/key/BPM pattern: notes live on the canonical library entry
-- and are snapshot-copied onto a service's song row when added/synced.
alter table public.library_songs add column notes text;
alter table public.songs add column notes text;
