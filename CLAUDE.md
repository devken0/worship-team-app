# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The line above is load-bearing: this repo runs **Next.js 16.2.6** (App Router) with **React 19**, which differ from older Next.js in conventions you may know. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (start at `index.md`). Notable here: the request `middleware` convention is renamed to **`proxy`** (see `src/proxy.ts`), and `cookies()`/`headers()` are async.

## Commands

```bash
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
npm start        # serve a production build
npm run lint     # eslint (flat config in eslint.config.mjs)
npm test         # vitest — pure logic only, ~1s
npm run test:e2e # playwright — signed-in flows, keyboard, both-theme screenshots
```

Type errors surface via `npm run build` (tsconfig has `noEmit`).

**Tests.** `npm test` covers pure functions only — no React, no Supabase, no mocks (`src/lib/*.test.ts`). It runs under `TZ=America/Los_Angeles` on purpose: the date helpers exist so everyone sees the same Manila date regardless of their phone's timezone, and under `Asia/Manila` they'd pass even when the logic is device-dependent.

`npm run test:e2e` drives the locally installed Chrome (`channel: "chrome"` — Playwright has no bundled Chromium for macOS 12) on a phone viewport. It needs a throwaway account in `.env.test.local` (template: `.env.test.example`); without one the whole suite skips. Visual baselines deliberately cover only `/design` — the real screens render live data, so their snapshots would go stale weekly and train everyone to re-accept diffs unread.

## Environment

Copy `.env.example` → `.env.local`. Five vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only secret), `NEXT_PUBLIC_SITE_URL`, and `CLEANUP_SECRET` (Bearer token gating the `/api/cleanup` storage-cleanup endpoint). Database schema, RLS, triggers, and storage buckets live as versioned migrations in `supabase/migrations/` (timestamp-named, applied in order). Manage them with the Supabase CLI: `supabase migration new <name>` to add one, `supabase db push` to apply unapplied migrations to the linked project. The base schema is `20250101000000_init.sql`. Full setup (linking, first admin, invite email template) is in `README.md`.

## Architecture

A mobile-first PWA for a church worship team: weekly Sunday services, role/song assignments, chords + YouTube links, and recordings. Backed entirely by Supabase (Postgres + Auth + Storage) — there is no separate API layer; Server Components and Server Actions talk to Supabase directly.

**Three Supabase clients** (`src/lib/supabase/`), do not mix them up:
- `server.ts` → `createClient()`: anon-key client for Server Components, Server Actions, and Route Handlers. Subject to Row Level Security.
- `server.ts` → `createAdminClient()`: **service-role** client that bypasses RLS. Server-only, never import into a Client Component. Used only for admin operations like inviting users (`auth.admin.inviteUserByEmail`).
- `client.ts`: browser client for Client Components.

**Auth & access control flow:**
- `src/proxy.ts` runs on every request (Node runtime) and calls `updateSession()` in `src/lib/supabase/middleware.ts`, which refreshes the session cookie and redirects signed-out users to `/login`. Public paths: `/login`, `/auth`, `/welcome`. When editing `middleware.ts`, keep `getUser()` immediately after `createServerClient` — running code between them breaks session refresh.
- Authorization is enforced in **two places** and both matter: Postgres RLS policies (the real boundary, via the `is_admin()` SQL function) and app-level checks (`isAdmin()` in `src/lib/auth.ts`) at the top of every mutating Server Action. Admin/member roles live in `profiles.role`.
- Sign-up is **invite-only**. An admin invites by email → a Postgres trigger (`handle_new_user`) auto-creates the `profiles` row → the invite link hits `src/app/auth/confirm/route.ts` which verifies the OTP and sends the user to `/welcome` to set a password.

**Domain model** is centralized in `src/lib/domain.ts` — TypeScript types, role/category enums, and display labels that **mirror the Postgres enums** in the migration. Change them together. Data fetching helpers (joining services + assignments + songs + member names) live in `src/lib/services.ts`.

**Routes** (`src/app/`): `/` (This Sunday dashboard), `/schedule` (+ `/[id]` detail), `/recordings`, `/profile`, `/manage` (admin-only: `service/new`, `service/[id]/edit`, `members`). Each route folder colocates an `actions.ts` of `"use server"` Server Actions; mutations call `revalidatePath()` for affected routes then `redirect()`.

## Design system

Tokens live in `src/app/globals.css`; primitives in `src/components/ui.tsx`, form fields in `src/components/form.tsx`, overlays in `src/components/Modal.tsx`. **`/design` renders every primitive on one screen** (dev-only) — check changes there in both themes before crawling the app.

- **Never use a raw Tailwind palette color** (`bg-gray-500`, `text-red-600`). They don't adapt to the dark theme, which is how two screens ended up pinned to white. Reach for a token: `bg-background` / `bg-card` / `text-foreground` / `text-muted` / `border-border` / `bg-primary` / `bg-brand-soft` / `danger` / `success`. An ESLint rule enforces this in `src/**`; genuinely fixed colors (a brand mark, white on a dim scrim) need an `eslint-disable-next-line` with the reason.
- **Dark mode is attribute-driven** (`data-theme="dark"` on `<html>`), set before first paint by the inline script in the root layout so there's no flash. Theme plumbing is shared in `src/lib/theme.ts` — the script and `ThemeToggle` must stay in sync, and the `<meta name="theme-color">` is created by that script rather than declared in a `viewport` export (Next re-emits metadata on hydration, producing two conflicting tags).
- **Buttons** go through `Button` / `buttonStyles` / `IconButton`. `IconButton` guarantees a 44px touch target via an invisible pseudo-element, so the visible circle can stay small.
- **Overlays** go through `Modal` (`center` or `sheet`), which owns backdrop, Escape, scroll lock and focus trapping. Don't hand-roll a dialog.
- **Motion budget: 150–250ms, ease-out, `opacity` and `transform` only.** Use the named animations (`animate-fade-in`, `animate-scale-in`, `animate-slide-up`, `animate-shimmer`) and the `--duration-*` / `--ease-out` tokens rather than ad-hoc values. Animating width/height/top/left is what makes the app feel slow. Don't animate nav tab switches or anything that blocks input. `prefers-reduced-motion` is handled globally — including a standing guard for `::view-transition-*`, which the universal selector can't reach.
- React's `<ViewTransition>` is **not available**: it needs React's experimental channel, and this app pins stable. Don't add `experimental.viewTransition` expecting it to work.

**Conventions worth matching:**
- The save pattern for services is **delete-then-reinsert** child rows (assignments, songs) rather than diffing — see `saveService` in `src/app/manage/service/actions.ts`.
- All dates render in **Asia/Manila** regardless of device timezone — always go through the helpers in `src/lib/format.ts` (`formatServiceDate`, `todayInManila`, `manilaInputToISO`, etc.), never raw `toLocaleString`. Parse plain dates via `manilaNoon()` with an explicit `+08:00`: without the offset the string resolves to noon in the *device's* timezone and rolls the date forward west of ~UTC-4.
- **Data volume is small** (tens of services and songs, ~12 profiles) and several queries read a whole small table in parallel on purpose. Before "optimizing" one into a bounded query, check it doesn't just add a sequential round trip — see the note on `buildNames` in `src/lib/services.ts`. `Paginated` is presentation, not pagination.
- Path alias `@/*` → `src/*`.
- Two storage buckets: `recordings` (private, served via signed URLs) and `chords` (public read, admin write). A song's chord photo is uploaded to `chords` from the admin service form; `songs.chords_image_url` stores the **path** (resolve to a public URL via `chordsImageUrl()` in `src/lib/format.ts`), and `songs.chords_url` is an optional external chord link. Both ride the delete-then-reinsert song save; replaced/removed photos are cleaned from the bucket in `saveService`/`deleteService`.
