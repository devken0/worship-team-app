-- =====================================================================
-- Email notification opt-out
-- ---------------------------------------------------------------------
-- The app sends per-member email (assignment notices, evaluation
-- follow-ups, recording-ready notices, and a weekly reminder). Members
-- are church volunteers, so they must be able to turn these off. This
-- flag is the single switch the notification layer checks before mailing
-- a member; default false means everyone is opted in.
-- =====================================================================
alter table public.profiles
  add column email_opt_out boolean not null default false;
