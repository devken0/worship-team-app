# Worship Team App

A simple, mobile-first web app for our church worship team — replacing the Facebook Messenger group chat for weekly schedules, role assignments, songs (YouTube + chords), what color to wear, and Sunday recordings.

Built with **Next.js 16** (App Router) and **Supabase** (Postgres + Auth + Storage).

## Features

- **This Sunday** dashboard — your assignment, rehearsal time, color to wear, and songs at a glance.
- **Schedule** — upcoming and past services.
- **Service detail** — band roles (pianist, bassist, drummer, rhythm/lead guitar), song leaders per song (welcoming/praise/worship), backup singers, note-taker, bible sharer, color, and each song with a YouTube player + chords.
- **Manage** (admins only) — create/edit a Sunday, assign roles, add songs + paste the pastor's YouTube links + chords, and invite members.
- **Recordings** — record the worship in the browser and upload, or paste a Google Drive / YouTube link. Listen back per service.
- **Invite-only** — the music director invites members by email; new members set their password and profile via the link.
- Installable as a phone app ("Add to Home Screen").

---

## Setup

### 1. Create a Supabase project
At [supabase.com](https://supabase.com), create a free project. Then from **Project Settings → API**, copy:
- Project URL
- `anon` public key
- `service_role` key (secret)

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Create the database
In the Supabase dashboard → **SQL Editor**, paste and run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
This creates all tables, security rules, the new-user trigger, and the
`recordings` (private) and `chords` (public) storage buckets.

### 4. Point invite emails at the app
So invitation links work with this app's login flow, edit the invite email
template in **Authentication → Email Templates → Invite user** and set the
link to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/welcome
```

Also add your site URL(s) under **Authentication → URL Configuration →
Redirect URLs** (e.g. `http://localhost:3000/**` and your production URL).

### 5. Create the first admin
Invitations come from inside the app, but the very first admin must be made by
hand:
1. **Authentication → Users → Add user** — create your account (set a password).
2. **SQL Editor** — make it an admin:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Your Name'
   where id = (select id from auth.users where email = 'you@email.com');
   ```

### 6. Run it
```bash
npm install
npm run dev
```
Open http://localhost:3000, sign in as the admin, then **Manage → Members** to
invite the rest of the team, and **Manage → + New** to post the first Sunday.

---

## Notes & limits

- **Recordings storage** is on Supabase's free tier (~1 GB ≈ ~6 months of
  worship at audio-only quality). The recordings list has a delete action, and
  in-app recordings older than 90 days are removed automatically — see
  [Storage cleanup](#storage-cleanup). Upgrade the Supabase plan if you need
  more, or paste Google Drive / YouTube links instead (those cost nothing).
- **iOS recording**: works on iOS 14.3+. On unsupported/old phones, the
  recordings screen falls back to pasting a Google Drive / YouTube link.
- **The pastor** doesn't need an account — he keeps sending YouTube links
  however he likes, and the music director pastes them into each song.

## Storage cleanup

To stay within Supabase's free tier, in-app recordings are temporary: those
older than **90 days** are deleted (file + row), and orphaned files left by
failed uploads or abandoned chord-photo picks are swept from both buckets.
External-link recordings cost nothing and are never auto-deleted.

The work lives in `src/lib/cleanup.ts` and is exposed two ways:

- **Manual** — admins can press **Run cleanup now** under **Manage →
  Maintenance** at any time. No scheduler needed.
- **Scheduled** — the protected endpoint `POST /api/cleanup` runs everything.
  Set a `CLEANUP_SECRET` env var and call it with
  `Authorization: Bearer <CLEANUP_SECRET>`. It returns a JSON summary; an
  unauthenticated call gets `401`.

**Schedule it for free (Vercel Cron):** add a `vercel.json` with

```json
{ "crons": [{ "path": "/api/cleanup", "schedule": "0 3 * * 0" }] }
```

and set an env var named `CRON_SECRET` to the **same value** as
`CLEANUP_SECRET` — Vercel injects `Authorization: Bearer <CRON_SECRET>` on
scheduled calls, which the endpoint checks. Alternatives: a GitHub Actions cron
or a free service like cron-job.org hitting the same URL with the header.

## Deploy

Deploy to [Vercel](https://vercel.com) (free): import the repo, add the same
environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `CLEANUP_SECRET`), and set
`NEXT_PUBLIC_SITE_URL` to the production URL. Remember to add the production URL
to Supabase's redirect URLs (step 4).
