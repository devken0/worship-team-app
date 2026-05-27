-- Evaluation minutes — one per service, filled in by the assigned note-taker.
-- Additive migration: run after 0001_init.sql in the Supabase SQL editor.

-- =====================================================================
-- Table: one row per service (service_id unique).
-- `action_items` (not "assignments") avoids confusion with the assignments table.
-- =====================================================================
create table public.evaluations (
  id              uuid primary key default gen_random_uuid(),
  service_id      uuid not null unique references public.services (id) on delete cascade,
  comments        text not null default '',   -- COMMENTS (Positive & Negative)
  recommendations text not null default '',   -- RECOMMENDATIONS AND SUGGESTIONS
  action_items    text not null default '',   -- ASSIGNMENT/S IF APPLICABLE
  problems        text not null default '',   -- PROBLEMS TO BE SOLVED
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index evaluations_service_idx on public.evaluations (service_id);

-- =====================================================================
-- Helper: is the current user the assigned note-taker for a service?
-- SECURITY DEFINER mirrors is_admin() to avoid RLS recursion on assignments.
-- =====================================================================
create or replace function public.is_note_taker(p_service_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where service_id = p_service_id
      and role_type = 'note_taker'
      and member_id = auth.uid()
  );
$$;

-- keep evaluations.updated_at fresh (reuses the existing trigger function)
create trigger evaluations_touch_updated
  before update on public.evaluations
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security: read for all members; write for the assigned
-- note-taker or an admin.
-- =====================================================================
alter table public.evaluations enable row level security;

create policy evaluations_select on public.evaluations
  for select to authenticated using (true);

create policy evaluations_admin_write on public.evaluations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy evaluations_notetaker_insert on public.evaluations
  for insert to authenticated
  with check (public.is_note_taker(service_id) and created_by = auth.uid());

create policy evaluations_notetaker_update on public.evaluations
  for update to authenticated
  using (public.is_note_taker(service_id))
  with check (public.is_note_taker(service_id));

-- =====================================================================
-- API role privileges. The grants in 0001_init.sql only covered tables
-- that existed when it ran, so grant explicitly for this new table.
-- =====================================================================
grant select, insert, update, delete on public.evaluations
  to anon, authenticated, service_role;
grant execute on function public.is_note_taker(uuid)
  to anon, authenticated, service_role;
