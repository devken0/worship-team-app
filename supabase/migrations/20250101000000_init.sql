-- Worship Team App — initial schema, RLS, triggers, and storage buckets.
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- =====================================================================
-- Enums
-- =====================================================================
create type user_role as enum ('admin', 'member');

create type assignment_role as enum (
  'pianist', 'bassist', 'drummer', 'rhythm_guitar', 'lead_guitar',
  'note_taker', 'bible_sharer', 'backup_singer'
);

create type song_category as enum ('welcoming', 'praise', 'worship');

-- =====================================================================
-- Tables
-- =====================================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        user_role not null default 'member',
  instruments text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table public.services (
  id                 uuid primary key default gen_random_uuid(),
  service_date       date not null,
  rehearsal_at       timestamptz,
  rehearsal_location text,
  wear_color_label   text,
  wear_color_hex     text,
  notes              text,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index services_date_idx on public.services (service_date desc);

create table public.assignments (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  role_type  assignment_role not null,
  member_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index assignments_service_idx on public.assignments (service_id);

create table public.songs (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services (id) on delete cascade,
  title            text not null,
  category         song_category not null,
  position         int not null default 0,
  song_leader_id   uuid references public.profiles (id) on delete set null,
  youtube_url      text,
  chords_text      text,
  chords_image_url text,
  created_at       timestamptz not null default now()
);
create index songs_service_idx on public.songs (service_id);

create table public.recordings (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services (id) on delete cascade,
  title            text not null default '',
  storage_path     text,        -- path within the 'recordings' bucket (in-app uploads)
  external_url     text,        -- pasted Google Drive / YouTube link (fallback)
  duration_seconds int,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index recordings_service_idx on public.recordings (service_id, created_at desc);

-- =====================================================================
-- Helper: is the current user an admin?
-- SECURITY DEFINER avoids RLS recursion when checking the profiles table.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
-- Trigger: create a profile row whenever an auth user is created
-- (covers admin invites). full_name comes from invite metadata if present.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep services.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger services_touch_updated
  before update on public.services
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.services    enable row level security;
alter table public.assignments enable row level security;
alter table public.songs       enable row level security;
alter table public.recordings  enable row level security;

-- API role privileges: the Supabase API roles need base table access before
-- RLS can take effect. RLS (the policies below) still governs *which rows*
-- anon/authenticated may touch; service_role bypasses RLS entirely.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;
grant execute on all functions in schema public
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- profiles: everyone signed in can read the team directory; you can edit
-- your own profile; admins can do anything.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- services / assignments / songs: read for all members, write for admins.
create policy services_select on public.services
  for select to authenticated using (true);
create policy services_admin_write on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy assignments_select on public.assignments
  for select to authenticated using (true);
create policy assignments_admin_write on public.assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy songs_select on public.songs
  for select to authenticated using (true);
create policy songs_admin_write on public.songs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- recordings: read for all members; any member can add; owner or admin deletes.
create policy recordings_select on public.recordings
  for select to authenticated using (true);
create policy recordings_insert on public.recordings
  for insert to authenticated with check (created_by = auth.uid());
create policy recordings_delete on public.recordings
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- =====================================================================
-- Storage buckets
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chords', 'chords', true)
on conflict (id) do nothing;

-- recordings bucket (private): members can read (we serve via signed URLs)
-- and upload; owner or admin can delete.
create policy recordings_obj_read on storage.objects
  for select to authenticated using (bucket_id = 'recordings');
create policy recordings_obj_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'recordings');
create policy recordings_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'recordings' and (owner = auth.uid() or public.is_admin()));

-- chords bucket (public read): anyone can read; only admins upload/replace.
create policy chords_obj_read on storage.objects
  for select using (bucket_id = 'chords');
create policy chords_obj_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'chords' and public.is_admin());
create policy chords_obj_delete on storage.objects
  for delete to authenticated using (bucket_id = 'chords' and public.is_admin());
