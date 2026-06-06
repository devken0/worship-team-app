import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Public routes that do not require a signed-in user. */
const PUBLIC_PATHS = ["/login", "/auth", "/welcome", "/s/"];

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
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    // Anchor to the public origin, not request.nextUrl: behind a reverse proxy
    // the request host is the container's internal address (0.0.0.0:3000), which
    // would redirect external visitors there. Fall back to the request origin
    // only in local dev (no env set).
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(new URL("/login", base));
  }

  return supabaseResponse;
}
