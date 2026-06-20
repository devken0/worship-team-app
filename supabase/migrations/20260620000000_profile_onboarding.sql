-- =====================================================================
-- Onboarding completion flag
-- ---------------------------------------------------------------------
-- An invited user is signed in (the invite OTP was verified) *before*
-- they set a password at /welcome. Without a way to tell whether that
-- step finished, a user could navigate away, sign out, and be left with
-- no password and no way back in. This flag is the source of truth the
-- middleware uses to keep such users on /welcome until setup is done.
--
-- Existing users already have a password set, so backfill them to true.
-- New rows created by handle_new_user() default to false.
-- =====================================================================
alter table public.profiles
  add column onboarded boolean not null default false;

update public.profiles set onboarded = true;
