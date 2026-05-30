-- 0003_song_library.sql
-- A reusable "song book": a canonical, admin-maintained library of songs that
-- members can browse and that admins can pull from when scheduling a service
-- (the service-form picker lands in a later migration). Each per-service row in
-- `songs` stays a snapshot copy — editing a library entry never rewrites past
-- services — so this table is purely additive to the 0001 schema.

create table public.library_songs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  default_category song_category,          -- optional default for the picker
  youtube_url      text,
  chords_text      text,
  chords_image_url text,                    -- path in the public 'chords' bucket
  chords_url       text,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One library entry per song title (case-insensitive); arrangements that differ
-- by key need distinct titles.
create unique index library_songs_title_key on public.library_songs (lower(title));

-- RLS: read for all members, write for admins — mirrors services/songs in 0001.
-- API-role base-table grants from 0001 already cover this table.
alter table public.library_songs enable row level security;

create policy library_songs_select on public.library_songs
  for select to authenticated using (true);
create policy library_songs_admin_write on public.library_songs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- keep library_songs.updated_at fresh (reuses the 0001 trigger function)
create trigger library_songs_touch_updated
  before update on public.library_songs
  for each row execute function public.touch_updated_at();
