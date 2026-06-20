import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Public routes that do not require a signed-in user. */
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/auth",
  "/welcome",
  "/s/",
  "/offline",
];

/**
 * Paths a signed-in but not-yet-onboarded user is still allowed to reach.
 * Everything else funnels them back to /welcome so they can't get stranded
 * with no password set (see the onboarding migration). /reset-password is here
 * because a password-recovery link signs the user in before they reach it.
 */
const ONBOARDING_EXEMPT = ["/welcome", "/auth", "/login", "/reset-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // API routes authenticate themselves (a Bearer secret for the cron endpoints,
  // or per-request getUser in a handler) and return JSON. They must never be
  // redirected to the HTML /login page — a cron/curl caller can't follow that,
  // which is why an unauthenticated POST /api/* was 307-ing to /login. Let them
  // through; the route handler decides who's allowed.
  if (path.startsWith("/api/")) {
    return supabaseResponse;
  }

  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Anchor redirects to the public origin, not request.nextUrl: behind a reverse
  // proxy the request host is the container's internal address (0.0.0.0:3000),
  // which would redirect external visitors there. Fall back to the request origin
  // only in local dev (no env set).
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", base));
  }

  if (user) {
    // Keep a not-yet-onboarded user pinned to /welcome until they've set a
    // password, and conversely keep a finished user off /welcome.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .single();
    const onboarded = profile?.onboarded ?? false;
    const exempt = ONBOARDING_EXEMPT.some((p) => path.startsWith(p));

    if (!onboarded && !exempt) {
      return NextResponse.redirect(new URL("/welcome", base));
    }
    if (onboarded && path.startsWith("/welcome")) {
      return NextResponse.redirect(new URL("/", base));
    }
  }

  return supabaseResponse;
}
